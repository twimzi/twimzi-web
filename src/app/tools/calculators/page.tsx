import type { Metadata } from "next";
import { CalculatorHub } from "@/components/tools/calculator-hub";

export const metadata: Metadata = {
  title: "Free Business Calculators | Interest, Profit, Cost & GST | Twimzi",
  description: "Free online business calculators for interest, EMI, gross profit margin, markup, break-even, product costing, landed cost and GST.",
  alternates: { canonical: "https://www.twimzi.com/tools/calculators" },
};

export default function BusinessCalculatorsPage() {
  return <CalculatorHub />;
}
