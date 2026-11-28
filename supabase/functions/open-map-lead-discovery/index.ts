import { createClient } from "npm:@supabase/supabase-js@2.117.1";

type Tags = Record<string,string>;
type Element = { type:"node"|"way"|"relation"; id:number; tags?:Tags };
const ATTRIBUTION="© OpenStreetMap contributors";
const LICENSE="Open Database License (ODbL)";
const LICENSE_URL="https://www.openstreetmap.org/copyright";
const USER_AGENT="TwimziLeadDiscovery/1.1 (+https://www.twimzi.com/contact)";
const LIMIT=100;
const DISTRICTS=[
 "Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur",
 "Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa",
 "Moga","Pathankot","Patiala","Rupnagar","S.A.S. Nagar","Sangrur",
 "Shaheed Bhagat Singh Nagar","Sri Muktsar Sahib","Tarn Taran"
];
const DISTRICT_RELATIONS:Record<string,number>={
 "Amritsar":1948548,"Barnala":9513462,"Bathinda":1948503,"Faridkot":1948544,
 "Fatehgarh Sahib":1948489,"Fazilka":9513284,"Ferozepur":1948545,"Gurdaspur":1948558,
 "Hoshiarpur":1948566,"Jalandhar":1948563,"Kapurthala":1948549,"Ludhiana":1948490,
 "Malerkotla":14724473,"Mansa":9513306,"Moga":1948506,"Pathankot":9513330,
 "Patiala":1948585,"Rupnagar":9513178,"S.A.S. Nagar":9513166,"Sahibzada Ajit Singh Nagar":9513166,"Sangrur":9513553,
 "Shaheed Bhagat Singh Nagar":1948565,"Sri Muktsar Sahib":1948530,"Tarn Taran":9513408
};
const CATEGORY_GROUPS=[
 {name:"Manufacturing & factories",selectors:['nwr["name"]["industrial"]','nwr["name"]["craft"]','nwr["name"]["man_made"="works"]','nwr["name"]["landuse"="industrial"]']},
 {name:"Agricultural machinery & farm suppliers",selectors:['nwr["name"]["shop"~"agrarian|farm|garden_centre|doityourself"]','nwr["name"]["craft"~"agricultural_engines|metal_construction"]','nwr["name"]["industrial"~"agricultural_machinery|machinery"]']},
 {name:"Wholesalers & distributors",selectors:['nwr["name"]["shop"~"wholesale|trade"]','nwr["name"]["office"~"company|distributor|logistics"]']},
 {name:"Exporters, importers & logistics",selectors:['nwr["name"]["office"~"company|logistics|freight|shipping"]','nwr["name"]["industrial"~"warehouse|logistics"]','nwr["name"]["shop"="trade"]']},
 {name:"Dealers & retailers",selectors:['nwr["name"]["shop"]','nwr["name"]["office"="company"]']},
 {name:"Professional services",selectors:['nwr["name"]["office"~"accountant|lawyer|consulting|insurance|architect|engineer|educational_institution"]','nwr["name"]["amenity"~"bank|clinic|doctors|pharmacy"]']},
 {name:"Home & industrial services",selectors:['nwr["name"]["craft"]','nwr["name"]["office"~"company|service"]','nwr["name"]["shop"~"hardware|electronics|car_repair|hvac"]']},
 {name:"Restaurants, hotels & local services",selectors:['nwr["name"]["amenity"~"restaurant|cafe|fast_food|bank|clinic|hospital|pharmacy|school|college|fuel"]','nwr["name"]["tourism"~"hotel|guest_house"]']}
];
const json=(data:Record<string,unknown>,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}});
function serviceKey(){const raw=Deno.env.get("SUPABASE_SECRET_KEYS");if(raw){try{const p=JSON.parse(raw);if(p.default)return p.default;}catch{}}return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";}
function clean(v:unknown,max=250):string|null{if(typeof v!=="string"&&typeof v!=="number")return null;const s=String(v).replace(/\s+/g," ").trim().slice(0,max);return s||null;}
function email(v:string|null){return v&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?v.toLowerCase():null;}
function phone(v:string|null){if(!v)return null;const n=v.replace(/\D/g,"");return n.length>=7&&n.length<=15?v:null;}
function normalizePhoneKey(v:string|null){
 if(!v)return null;
 const d=v.replace(/\\D/g,"");
 if(!d)return null;
 if(d.length===12&&d.startsWith("91"))return d.slice(-10);
 if(d.length===11&&d.startsWith("0"))return d.slice(-10);
 return d;
}
function website(v:string|null){if(!v)return null;try{const u=new URL(v.includes("://")?v:"https://"+v);if(!["http:","https:"].includes(u.protocol)||u.username||u.password||u.hostname==="localhost"||/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname))return null;return u.toString().slice(0,1000);}catch{return null;}}
function category(t:Tags){for(const k of ["shop","office","craft","industrial","amenity","tourism","leisure"])if(t[k]&&t[k]!=="yes")return k[0].toUpperCase()+k.slice(1)+": "+t[k].replace(/_/g," ");return "Business";}
function address(t:Tags){const p=[t["addr:housenumber"],t["addr:street"],t["addr:suburb"],t["addr:city"]||t["addr:town"]||t["addr:village"],t["addr:district"]||t["addr:county"],t["addr:postcode"]].filter(Boolean);return p.length?p.join(", ").slice(0,500):null;}
function buildQuery(district:string,relationId:number,selectors:string[]){const statements=selectors.map(s=>s+"(area.twimziDistrictArea);").join("");return '[out:json][timeout:45];rel('+relationId+')->.twimziDistrict; .twimziDistrict map_to_area->.twimziDistrictArea;('+statements+');out center tags '+LIMIT+';';}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json({error:"POST required"},405);
 const url=Deno.env.get("SUPABASE_URL"),key=serviceKey();if(!url||!key)return json({error:"Worker configuration missing"},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const bearer=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"")??"",token=req.headers.get("x-twimzi-cron-token")??"";
 let cronAuthorized=false,adminAuthorized=false;
 if(token){const v=await db.rpc("validate_lead_discovery_token",{candidate:token});cronAuthorized=!v.error&&v.data===true;}
 if(!cronAuthorized&&bearer){
  if(bearer===key)adminAuthorized=true;
  else{
   const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??Deno.env.get("SUPABASE_PUBLISHABLE_KEY")??"";
   if(anonKey){const caller=createClient(url,anonKey,{global:{headers:{Authorization:"Bearer "+bearer}},auth:{persistSession:false,autoRefreshToken:false}});const {data:userData,error:userError}=await caller.auth.getUser();if(!userError&&userData.user){const {data:allowed,error:adminError}=await caller.rpc("is_super_admin");adminAuthorized=!adminError&&allowed===true;}}
  }
 }
 if(!cronAuthorized&&!adminAuthorized)return json({error:"Unauthorized: Super Admin session or scheduled-worker token required"},401);
 let body:Record<string,unknown>={};try{body=await req.json();}catch{}
 if(!adminAuthorized)return json({error:"Manual discovery requires an authenticated Super Admin session"},401);
 const districtInput=clean(body.district,100);
 const normalizeDistrict=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,"");
 const districtKey=districtInput?Object.keys(DISTRICT_RELATIONS).find(key=>normalizeDistrict(key)===normalizeDistrict(districtInput)):undefined;
 const districtAliases:Record<string,string>={"sasnagar":"S.A.S. Nagar","mohali":"S.A.S. Nagar","ajitsinghnagar":"Sahibzada Ajit Singh Nagar","nawanshahr":"Shaheed Bhagat Singh Nagar","muktsar":"Sri Muktsar Sahib"};
 const district=districtKey|| (districtInput?districtAliases[normalizeDistrict(districtInput)]:undefined);
 const selectedCategory=clean(body.category,150);
 const categoryGroup=CATEGORY_GROUPS.find(group=>group.name===selectedCategory);
 if(!district||!DISTRICT_RELATIONS[district])return json({error:"Invalid Punjab district selection: "+(districtInput||"empty")+". Please choose a district from the current list."},400);
 if(!categoryGroup)return json({error:"Select a valid business category"},400);
 const {data:running}=await db.from("lead_generator_discovery_runs").select("id,status,started_at").eq("status","running").order("started_at",{ascending:false}).limit(1);
 if(running?.length)return json({status:"skipped",already_running:true,reason:"Another discovery run is already running",last_run:running[0].started_at},409);
 const {data:run,error:runErr}=await db.from("lead_generator_discovery_runs").insert({provider:"OpenStreetMap Overpass API",licence:LICENSE,region_state:"Punjab",selected_district:district,selected_category:categoryGroup.name,status:"running",attribution:ATTRIBUTION}).select("id").single();
 if(runErr||!run)return json({status:"skipped",already_running:true,reason:"Another discovery run is active"},409);
 const counts={seen:0,inserted:0,duplicate:0,rejected:0};
 try{
  const relationId=DISTRICT_RELATIONS[district];if(!relationId)throw new Error('No verified OpenStreetMap district relation configured for '+district);const query=buildQuery(district,relationId,categoryGroup.selectors);
  const endpoints=[
   "https://ovp.dresel.systems/api-as/interpreter",
   "https://overpass.kumi.systems/api/interpreter",
   "https://overpass-api.de/api/interpreter"
  ];
  let payload:Record<string,unknown>|null=null;
  const endpointErrors:string[]=[];
  for(const endpoint of endpoints){
   try{
    const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded; charset=UTF-8","user-agent":USER_AGENT,"accept":"application/json, text/plain;q=0.9, */*;q=0.8"},body:"data="+encodeURIComponent(query),signal:AbortSignal.timeout(80_000)});
    if(!response.ok){
     const status=response.status;
     const detail=(await response.text().catch(()=>"")).replace(/<[^>]*>/g," ").replace(/\\s+/g," ").trim().slice(0,100);
     endpointErrors.push(new URL(endpoint).host+" HTTP "+status+(detail?": "+detail:""));
     if([400,401,403,404].includes(status))throw new Error(endpointErrors[endpointErrors.length-1]);
     continue;
    }
    const parsed=await response.json();
    if(!parsed||!Array.isArray(parsed.elements))throw new Error(new URL(endpoint).host+" returned an invalid Overpass response");
    payload=parsed;
    break;
   }catch(error){
    const message=error instanceof Error?error.message:"Overpass request failed";
    endpointErrors.push(message.slice(0,180));
   }
  }
  if(!payload)throw new Error("All Overpass endpoints failed: "+endpointErrors.join(" | ").slice(0,420));
  const elements=payload.elements as Element[];
  for(const el of elements.slice(0,LIMIT)){
   counts.seen++;const t=el.tags??{},name=clean(t.name,200);if(!name){counts.rejected++;continue;}
   const sourceUrl="https://www.openstreetmap.org/"+el.type+"/"+el.id;
   const {data:exists,error:dupErr}=await db.from("admin_contact_bank").select("id").eq("source_url",sourceUrl).limit(1);
   if(dupErr)throw new Error("Duplicate check failed");if(exists?.length){counts.duplicate++;continue;}
   const mail=email(clean(t["contact:email"]||t.email,254)),tel=phone(clean(t["contact:phone"]||t.phone,40)),site=website(clean(t["contact:website"]||t.website,1000));
   if(!mail&&!tel){counts.rejected++;continue;}
   if(mail){
    const {data:emailMatches,error:emailMatchError}=await db.from("admin_contact_bank_review").select("id").eq("normalized_email",mail).limit(1);
    if(emailMatchError)throw new Error("Email duplicate check failed");
    if(emailMatches?.length){counts.duplicate++;continue;}
   }
   const phoneKey=normalizePhoneKey(tel);
   if(phoneKey){
    const {data:phoneMatches,error:phoneMatchError}=await db.from("admin_contact_bank_review").select("id").eq("normalized_phone",phoneKey).limit(1);
    if(phoneMatchError)throw new Error("Phone duplicate check failed");
    if(phoneMatches?.length){counts.duplicate++;continue;}
   }
   const city=clean(t["addr:city"]||t["addr:town"]||t["addr:village"]||t["addr:place"],120),districtName=clean(t["addr:district"]||t["addr:county"],120);
   const row={full_name:name,company_name:name,contact_type:"business",country:"India",state:"Punjab",city,district:districtName||district,business_address:address(t),business_category:category(t),email:mail,email_kind:mail?"business":"unknown",phone:tel,website:site,website_domain:site?new URL(site).hostname.toLowerCase().replace(/^www\./,""):null,source:"OpenStreetMap",source_type:"lead_generator",source_url:sourceUrl,source_collected_at:new Date().toISOString(),source_last_checked_at:new Date().toISOString(),review_status:"pending",verification_status:"unverified",collection_basis:"OpenStreetMap ODbL data; "+sourceUrl+"; attribution "+ATTRIBUTION+"; licence "+LICENSE_URL,tags:["openstreetmap","odbl","punjab",district.toLowerCase(),categoryGroup.name.toLowerCase()],email_marketing_consent:false,whatsapp_marketing_consent:false,do_not_contact:false};
   const {error:insErr}=await db.from("admin_contact_bank").insert(row);if(insErr){if(insErr.code==="23505")counts.duplicate++;else throw new Error("Business record insert failed");}else counts.inserted++;
  }
  await db.from("lead_generator_discovery_runs").update({status:"completed",records_seen:counts.seen,records_inserted:counts.inserted,records_duplicate:counts.duplicate,records_rejected:counts.rejected,finished_at:new Date().toISOString()}).eq("id",run.id);
  return json({status:"completed",run_id:run.id,counts,selection:{district,category:categoryGroup.name},provider:"OpenStreetMap",region:"Punjab",attribution:ATTRIBUTION,licence:LICENSE});
 }catch(e){const msg=e instanceof Error?e.message.slice(0,500):"Discovery failed";await db.from("lead_generator_discovery_runs").update({status:"failed",error_message:msg,records_seen:counts.seen,records_inserted:counts.inserted,records_duplicate:counts.duplicate,records_rejected:counts.rejected,finished_at:new Date().toISOString()}).eq("id",run.id);return json({status:"failed",error:msg,counts,selection:{district,category:categoryGroup.name}},502);}
});