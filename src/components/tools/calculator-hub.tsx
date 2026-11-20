"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calculator, ChartNoAxesCombined, CircleHelp, IndianRupee, Percent, RotateCcw, Wallet } from "lucide-react";

type CalculatorKey = "simple" | "compound" | "emi" | "margin" | "markup" | "breakEven" | "productCost" | "landed" | "gst";
type Field = { key: string; label: string; defaultValue: number; prefix?: string; suffix?: string; step?: string };

const definitions: { key: CalculatorKey; category: string; title: string; description: string; fields: Field[] }[] = [
  { key:"simple",category:"Finance",title:"Simple Interest Calculator",description:"Calculate interest earned or payable on a principal amount.",fields:[{key:"principal",label:"Principal amount",defaultValue:100000,prefix:"₹"},{key:"rate",label:"Annual interest rate",defaultValue:10,suffix:"%"},{key:"years",label:"Time period",defaultValue:2,suffix:"Years"}] },
  { key:"compound",category:"Finance",title:"Compound Interest Calculator",description:"Estimate compound growth with selectable compounding frequency.",fields:[{key:"principal",label:"Principal amount",defaultValue:100000,prefix:"₹"},{key:"rate",label:"Annual interest rate",defaultValue:10,suffix:"%"},{key:"years",label:"Time period",defaultValue:3,suffix:"Years"},{key:"frequency",label:"Compounds per year",defaultValue:4}] },
  { key:"emi",category:"Finance",title:"Loan EMI Calculator",description:"Estimate monthly instalment, total repayment and total interest.",fields:[{key:"principal",label:"Loan amount",defaultValue:1000000,prefix:"₹"},{key:"rate",label:"Annual interest rate",defaultValue:9,suffix:"%"},{key:"years",label:"Loan tenure",defaultValue:5,suffix:"Years"}] },
  { key:"margin",category:"Profitability",title:"Gross Profit Margin Calculator",description:"Calculate gross profit and margin from selling price and cost.",fields:[{key:"revenue",label:"Selling price / revenue",defaultValue:1500,prefix:"₹"},{key:"cost",label:"Cost of goods sold",defaultValue:900,prefix:"₹"}] },
  { key:"markup",category:"Profitability",title:"Markup & Selling Price Calculator",description:"Set a selling price using your cost and target markup percentage.",fields:[{key:"cost",label:"Product cost",defaultValue:800,prefix:"₹"},{key:"markup",label:"Markup on cost",defaultValue:25,suffix:"%"}] },
  { key:"breakEven",category:"Profitability",title:"Break-even Calculator",description:"Find how many units you need to sell to cover fixed costs.",fields:[{key:"fixed",label:"Fixed costs",defaultValue:50000,prefix:"₹"},{key:"price",label:"Selling price per unit",defaultValue:500,prefix:"₹"},{key:"variable",label:"Variable cost per unit",defaultValue:300,prefix:"₹"}] },
  { key:"productCost",category:"Costing",title:"Product Cost Calculator",description:"Add material, labour and overhead costs to estimate unit cost and price.",fields:[{key:"material",label:"Material cost per unit",defaultValue:250,prefix:"₹"},{key:"labour",label:"Labour cost per unit",defaultValue:80,prefix:"₹"},{key:"overhead",label:"Overhead per unit",defaultValue:40,prefix:"₹"},{key:"margin",label:"Target gross margin",defaultValue:30,suffix:"%"}] },
  { key:"landed",category:"Costing",title:"Landed Cost Calculator",description:"Estimate per-unit landed cost including freight, duty and other charges.",fields:[{key:"purchase",label:"Purchase value",defaultValue:100000,prefix:"₹"},{key:"freight",label:"Freight / shipping",defaultValue:8000,prefix:"₹"},{key:"duty",label:"Customs duty / other charges",defaultValue:5000,prefix:"₹"},{key:"quantity",label:"Number of units",defaultValue:100}] },
  { key:"gst",category:"Tax & Pricing",title:"GST Calculator",description:"Calculate GST amount and inclusive or exclusive invoice value.",fields:[{key:"amount",label:"Amount",defaultValue:10000,prefix:"₹"},{key:"rate",label:"GST rate",defaultValue:18,suffix:"%"},{key:"mode",label:"Mode (0 = add GST, 1 = extract GST)",defaultValue:0}] },
];

const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
const pct=(n:number)=>`${Number.isFinite(n)?n.toFixed(2):"0.00"}%`;

function calculate(key:CalculatorKey,v:Record<string,number>){
  switch(key){
    case "simple": { const interest=v.principal*v.rate*v.years/100; return [{label:"Interest",value:money(interest)},{label:"Total amount",value:money(v.principal+interest)}];}
    case "compound": {const n=Math.max(1,v.frequency);const total=v.principal*Math.pow(1+v.rate/(100*n),n*v.years);return [{label:"Maturity amount",value:money(total)},{label:"Interest earned",value:money(total-v.principal)}];}
    case "emi": {const r=v.rate/1200;const months=Math.max(1,Math.round(v.years*12));const emi=r===0?v.principal/months:v.principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);return [{label:"Monthly EMI",value:money(emi)},{label:"Total repayment",value:money(emi*months)},{label:"Total interest",value:money(emi*months-v.principal)}];}
    case "margin": {const profit=v.revenue-v.cost;return [{label:"Gross profit",value:money(profit)},{label:"Gross profit margin",value:pct(v.revenue>0?profit/v.revenue*100:0)},{label:"Markup on cost",value:pct(v.cost>0?profit/v.cost*100:0)}];}
    case "markup": {const price=v.cost*(1+v.markup/100);return [{label:"Selling price",value:money(price)},{label:"Gross profit",value:money(price-v.cost)},{label:"Gross margin",value:pct(price>0?(price-v.cost)/price*100:0)}];}
    case "breakEven": {const contribution=v.price-v.variable;const units=contribution>0?Math.ceil(v.fixed/contribution):0;return [{label:"Break-even units",value:contribution>0?units.toLocaleString("en-IN"):"Not achievable"},{label:"Contribution per unit",value:money(contribution)},{label:"Break-even sales",value:contribution>0?money(units*v.price):"—"}];}
    case "productCost": {const cost=v.material+v.labour+v.overhead;const price=v.margin<100?cost/(1-v.margin/100):0;return [{label:"Total unit cost",value:money(cost)},{label:"Suggested selling price",value:price>0?money(price):"Enter margin below 100%"},{label:"Gross profit per unit",value:price>0?money(price-cost):"—"}];}
    case "landed": {const total=v.purchase+v.freight+v.duty;return [{label:"Total landed cost",value:money(total)},{label:"Landed cost per unit",value:v.quantity>0?money(total/v.quantity):"Enter units"}];}
    case "gst": {const rate=v.rate/100;const inclusive=v.mode===1;const base=inclusive?v.amount/(1+rate):v.amount;const tax=inclusive?v.amount-base:v.amount*rate;return [{label:"Taxable value",value:money(base)},{label:"GST amount",value:money(tax)},{label:inclusive?"Amount including GST":"Total including GST",value:money(base+tax)}];}
  }
}

export function CalculatorHub(){
  const [selected,setSelected]=useState<CalculatorKey>("margin");
  const [values,setValues]=useState<Record<string,number>>({});
  const active=definitions.find(x=>x.key===selected)!;
  const current=useMemo(()=>Object.fromEntries(active.fields.map(f=>[f.key,values[`${selected}.${f.key}`]??f.defaultValue])),[active,selected,values]);
  const results=useMemo(()=>calculate(selected,current),[selected,current]);
  const categories=["All","Finance","Profitability","Costing","Tax & Pricing"];
  const [category,setCategory]=useState("All");
  const visible=category==="All"?definitions:definitions.filter(x=>x.category===category);
  const update=(key:string,value:number)=>setValues(prev=>({...prev,[`${selected}.${key}`]:value}));
  const reset=()=>setValues(prev=>{const next={...prev};active.fields.forEach(f=>delete next[`${selected}.${f.key}`]);return next;});
  return <main className="min-h-screen bg-slate-50">
    <section className="border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-blue-700"><Calculator className="h-4 w-4"/> Twimzi business tools</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Make better business decisions <span className="block bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">with practical calculators</span></h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Calculate interest, EMI, gross margins, selling prices, break-even points, product costs and GST—all in one place.</p>
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:px-8">
      <div>
        <div className="flex flex-wrap gap-2">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${category===c?"bg-slate-900 text-white":"border border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{c}</button>)}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {visible.map(item=><button key={item.key} onClick={()=>setSelected(item.key)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selected===item.key?"border-blue-300 bg-blue-50/70 shadow-sm":"border-slate-200 bg-white"}`}>
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700">{item.category}</span><span className="mt-2 block font-bold text-slate-900">{item.title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{item.description}</span>
          </button>)}
        </div>
      </div>
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{active.category}</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">{active.title}</h2><p className="mt-2 text-sm leading-5 text-slate-500">{active.description}</p></div><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><ChartNoAxesCombined className="h-5 w-5"/></span></div>
        <div className="mt-6 space-y-4">{active.fields.map(field=><label key={field.key} className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</span><div className="flex items-center rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">{field.prefix?<span className="pl-3 text-sm text-slate-400">{field.prefix}</span>:null}<input type="number" min="0" step={field.step||"any"} value={current[field.key]} onChange={e=>update(field.key,Math.max(0,Number(e.target.value)||0))} className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none"/>{field.suffix?<span className="pr-3 text-sm text-slate-400">{field.suffix}</span>:null}</div></label>)}</div>
        <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><IndianRupee className="h-4 w-4"/> Calculation results</p><div className="mt-4 space-y-4">{results.map(result=><div key={result.label} className="flex items-end justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"><span className="text-sm text-slate-300">{result.label}</span><strong className="text-right text-lg font-bold">{result.value}</strong></div>)}</div></div>
        <button onClick={reset} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700"><RotateCcw className="h-4 w-4"/> Reset calculator</button>
        <p className="mt-5 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0"/> Indicative estimates only. Verify applicable tax rules, lender terms, units and actual costs before making financial or commercial decisions.</p>
      </aside>
    </section>
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-6 sm:flex-row sm:items-center"><div><h2 className="font-bold text-slate-900">Need to compare supplier prices?</h2><p className="mt-1 text-sm text-slate-600">Use Twimzi Price Discovery to explore products with published supplier prices.</p></div><a href="/products/prices" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-blue-700 hover:underline">Explore product prices <ArrowRight className="h-4 w-4"/></a></div></section>
  </main>;
}
