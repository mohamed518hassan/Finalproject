"use client";
import Link from "next/link";

export default function AllOrdersPage() {
  return (
    <div className="container mx-auto py-20 px-4 text-center">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-xl mx-auto border border-gray-100">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-4 text-emerald-600">
          تم إتمام الطلب بنجاح!
        </h1>
        <p className="text-gray-600 mb-6">
          شكراً لك! تم استلام طلبك وتسجيل عملية الدفع بنجاح في بيئة الاختبار.
        </p>
        <Link
          href="/"
          className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
