import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-bold text-lg">尾張東剣道連盟</span>
          </div>

          <div>
            <h3 className="font-semibold mb-4">サイトマップ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#hero-section"
                  className="text-gray-300 hover:text-red-500 transition-colors duration-200"
                >
                  ホーム
                </a>
              </li>
              <li>
                <a
                  href="#schedule-section"
                  className="text-gray-300 hover:text-red-500 transition-colors duration-200"
                >
                  行事予定
                </a>
              </li>
              <li>
                <a
                  href="#examination-info-section"
                  className="text-gray-300 hover:text-red-500 transition-colors duration-200"
                >
                  昇段審査
                </a>
              </li>
              <li>
                <a
                  href="#dojo-introduction-section"
                  className="text-gray-300 hover:text-red-500 transition-colors duration-200"
                >
                  道場紹介
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">お問い合わせ</h3>
            <p className="text-sm text-gray-300 mb-2">
              お問い合わせは以下のメールアドレスまでご連絡ください。
            </p>
            <p className="text-lg font-bold text-gray-100">owarihigasiken@gmail.com</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-sm text-gray-400">2026 尾張東剣道連盟. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
