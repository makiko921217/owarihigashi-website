import Link from "next/link"
import Image from "next/image"
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
          <div className="mx-auto mb-6 flex justify-center max-w-2xl">
            <Image
              src="/flag.png"
              alt="Owari East Kendo Federation Flag"
              width={672}
              height={672}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground mb-8 text-left">
            尾張東剣道連盟は、長久手市、日進市及び東郷町内の剣道団体に所属、若しくは在学する者で、剣道(居合道を含む)の愛好者をもって組織され、平成19年4月1日に発足しました。
            目的は、心身の錬磨と会員相互の親睦を図り、一致団結して剣道の普及と発展に寄与する事を目的としています。
            標語は「交剣知愛」とし、尾張東地区内(長久手市、日進市、東郷町)の青少年、学生、一般社会人の剣道愛好者が、練習会、剣道大会等でお互いが剣を交えることにより、心身の練磨と、親交を深め、思いやりの精神をもって自他共に認め合う、仲の良い人間関係を築くことです。
            剣道の理念は、「剣の理法の修錬による、人間形成の道である」と教えています。私たちは、この理念の基に修錬に励み、日本の伝統文化である剣道を守って行きたいと思っています。
            <br></br>尾張東剣道連盟理事長　廣國　憲治
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
          <ul className="mt-8 space-y-4">{/* ここにイベント名を入れる */}
            <li className="text-muted-foreground">  4/4 尾張形講習審査会 / 瀬戸市体育館 </li>
            <li className="text-muted-foreground">  4/5 三地区級位審査会 / 瀬戸市体育館 </li>
            <li className="text-muted-foreground">  4/11 尾張実技審査会 / 瀬戸市体育館 </li>
            <li className="text-muted-foreground">  4/26 尾張東合同稽古会 / 日進市スポーツセンター </li> 
            <li className="text-muted-foreground">  4/26 剣道四・五段審査会 / 天白スポーツセンター </li> 
            
                
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
          
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="https://nissinkenyukai.wixsite.com/kendo" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">日進剣友会</h3>
            </a>
            <a href="https://aisyouken.coresv.net/" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">愛知少年剣友会</h3>
            </a>
            <a href="https://rikuzenkai2006.weebly.com/" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">六然会</h3>
            </a>
            <a href="https://www.nagakute-sport.com/%E5%89%A3%E9%81%93%E9%83%A8-%E9%95%B7%E4%B9%85%E6%89%8B%E5%B8%82%E5%89%A3%E9%81%93%E6%95%99%E5%AE%A4" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">長久手市剣道教室</h3>
            </a>
         </div>*/}

        </div>
      </section>

    {/* Dojo Introduction Section */}
      <section id="dojo-introduction-section" className="dojo-introduction-section py-16 px-4 bg-background">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">道場紹介</h2>
            <p className="text-lg text-muted-foreground">
              尾張東地区の道場を紹介します。
            </p>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="https://nissinkenyukai.wixsite.com/kendo" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">日進剣友会</h3>
            </a>
            <a href="https://aisyouken.coresv.net/" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">愛知少年剣友会</h3>
            </a>
            <a href="https://rikuzenkai2006.weebly.com/" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">六然会</h3>
            </a>
            <a href="https://www.nagakute-sport.com/%E5%89%A3%E9%81%93%E9%83%A8-%E9%95%B7%E4%B9%85%E6%89%8B%E5%B8%82%E5%89%A3%E9%81%93%E6%95%99%E5%AE%A4" className="block p-6 rounded-lg border border-border hover:bg-muted/50 hover:border-primary transition-colors">
              <h3 className="font-semibold text-foreground text-lg">長久手市剣道教室</h3>
            </a>
          </div>
        </div>
      </section> 

      <Footer />
    </div>
  )
}
