import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section id="hero-section" className="hero-section relative bg-gradient-to-b from-muted/50 to-background py-24 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">尾張東剣道連盟の紹介</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground mb-8 text-left">
            尾張東剣道連盟は、長久手市、日進市及び東郷町内の剣道団体に所属、若しくは在学する者で、剣道(居合道を含む)の愛好者をもって組織され、平成19年4月1日に発足しました。
            目的は、心身の錬磨と会員相互の親睦を図り、一致団結して剣道の普及と発展に寄与する事を目的としています。
            標語は「交剣知愛」とし、尾張東地区内(長久手市、日進市、東郷町)の青少年、学生、一般社会人の剣道愛好者が、練習会、剣道大会等でお互いが剣を交えることにより、心身の練磨と、親交を深め、思いやりの精神をもって自他共に認め合う、仲の良い人間関係を築くことです。
            剣道の理念は、「剣の理法の修錬による、人間形成の道である」と教えています。私たちは、この理念の基に修錬に励み、日本の伝統文化である剣道を守って行きたいと思っています。
            尾張東剣道連盟<br></br>理事長　山本允圀
          </p>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule-section" className="schedule-section py-16 px-4 bg-background">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-8">直近の行事予定</h2>
          <div className="relative overflow-hidden" style={{ paddingBottom: "75%", height: 0 }}>
            <iframe
              src="https://calendar.google.com/calendar/embed?src=ba593ebf0cfa60391b78106323084ce881c51befa0c2880f8d6a181a0e00afe2%40group.calendar.google.com&ctz=Asia%2FTokyo"
              style={{
                border: 0,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
              frameBorder="0"
              scrolling="no"
            ></iframe>
          </div>
          <ul className="mt-8 space-y-4">
            <li className="text-muted-foreground">イベント名: 日進大会 / 参加要件: 尾張東の小中学生 / 料金:1,000円</li>
            <li className="text-muted-foreground">イベント名: 尾張東審判講習会：参加費:1000
              円</li>
            <li className="text-muted-foreground">イベント名: 尾張東剣道大会: 小中高校生：参加費1000円</li>
          </ul>
        </div>
      </section>

      {/* Examination Info Section */}
      <section id="examination-info-section" className="examination-info-section py-16 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">昇段審査について</h2>
          <p className="text-lg text-muted-foreground mb-8">
            昇段審査の詳細情報をここに記載します。
          </p>
        </div>
      </section>

      {/* Dojo Introduction Section */}
      <section id="dojo-introduction-section" className="dojo-introduction-section py-16 px-4 bg-background">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">道場紹介</h2>
          <p className="text-lg text-muted-foreground mb-8">
            尾張東地区の道場を紹介します。
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
