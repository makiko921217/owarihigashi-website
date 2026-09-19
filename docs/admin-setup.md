# 管理画面のセットアップ

## 全体像

このリポジトリは **2 か所にデプロイ**されます。

```
                     ┌─────────────────────────────────┐
  お母様が編集  ───▶ │ 管理画面デプロイ（あなたのVercel）│
                     │ ADMIN_MODE=1                    │
                     │ 公開ページは出さず /admin のみ   │
                     └───────────────┬─────────────────┘
                                     │ GitHub API でコミット
                                     ▼
                     ┌─────────────────────────────────┐
                     │ makiko921217/owarihigashi-website│
                     │   data/content.json              │
                     │   public/pdf/*.pdf               │
                     └───────────────┬─────────────────┘
                                     │ push を検知して自動デプロイ
                                     ▼
                     ┌─────────────────────────────────┐
  会員が閲覧    ───▶ │ 本番サイト（お母様のVercel）     │
                     │ owarihigashi-website-xi...      │
                     └─────────────────────────────────┘
```

**お母様の Vercel アカウントには一切触りません。** 公開 URL も変わりません。
保存からサイト反映までは、再デプロイを挟むので 2〜3 分かかります。

---

## 1. GitHub のアクセストークンを作る

管理画面がリポジトリにコミットするために使います。

https://github.com/settings/tokens → **Tokens (classic)** → Generate new token

| 項目 | 値 |
| --- | --- |
| Note | `owarihigashi-admin` |
| Expiration | 1年（期限切れ時は再発行して環境変数を差し替える） |
| Scope | **`repo`** のみ |

> `makiko921217/owarihigashi-website` はあなたが admin ではなく collaborator なので、
> fine-grained token では対象リポジトリとして選べない場合があります。
> その場合は上記の classic token を使ってください。

生成された `ghp_...` を控えます。**この画面を離れると二度と表示されません。**

---

## 2. 管理画面のパスワードを作る

```bash
npm run admin:password
```

自分で決めた文字列を使う場合:

```bash
npm run admin:password -- "好きなパスワード"
```

出力される 3 つのうち、

- **パスワード** … お母様に渡す。**どこにも保存されないので必ず控える**
- **ADMIN_PASSWORD_HASH** … 次の手順で登録する
- **SESSION_SECRET** … 次の手順で登録する

---

## 3. あなたの Vercel に管理画面をデプロイする

```bash
npx vercel login          # 自分のアカウントで
npx vercel link           # 「新しいプロジェクトを作る」を選び、名前は owarihigashi-admin など
```

GitHub 連携は **不要**（というより、対象リポジトリに admin 権限がないため連携できません）。
このプロジェクトはローカルからの CLI デプロイで更新します。

環境変数を登録します。

```bash
npx vercel env add ADMIN_PASSWORD_HASH production
npx vercel env add SESSION_SECRET      production
npx vercel env add GITHUB_TOKEN        production
npx vercel env add GITHUB_REPO         production   # makiko921217/owarihigashi-website
npx vercel env add GITHUB_BRANCH       production   # main
npx vercel env add ADMIN_MODE          production   # 1
```

デプロイします。

```bash
npx vercel deploy --prod
```

表示された URL（例 `https://owarihigashi-admin.vercel.app`）が管理画面です。

> `ADMIN_MODE=1` を入れ忘れると、この URL でサイト本体が二重公開されてしまいます。
> 必ず入れてください。入っていれば `/` は `/admin` に転送され、`robots.txt` も全面拒否になります。

---

## 4. サイト本体側を更新する

管理画面が読み書きする `data/content.json` と、変更後の `app/page.tsx` を
本番リポジトリに反映します。

```bash
git add .
git commit -m "管理画面を追加"
git push
```

お母様の Vercel が自動でデプロイし、サイトは `data/content.json` の内容で表示されるようになります。
見た目は今までと変わりません。

---

## 5. 動作確認

1. 管理画面の URL を開く → ログイン画面が出る
2. パスワードでログイン → 現在の行事予定と審査ボタンが表示される
3. 赤い警告帯が**出ていない**ことを確認
4. 行事予定をひとつ直して「公開する」
5. GitHub のコミット履歴に「行事予定・審査案内を更新（管理画面より）」が増える
6. 2〜3 分待って本番サイトに反映されるのを確認

---

## 管理画面のコードを直したとき

```bash
npx vercel deploy --prod
```

GitHub 連携していないので、`git push` では管理画面は更新されません。ここだけ注意。

## パスワードを変えるとき（緊急時の手順書）

漏洩の疑い、退任、単純な変更、いずれもこの手順です。
**パスワードを変えると、ログイン中のセッションはすべて即座に無効**になります
（セッショントークンにパスワードの指紋を埋めてあるため、再デプロイを待たずに失効します）。

### 前提

| 項目 | 値 |
| --- | --- |
| Vercel プロジェクト | `owarihigashi-admin`（**あなたの**アカウント `shun020921-2138s-projects`） |
| 管理画面 URL | https://owarihigashi-admin.vercel.app/admin |
| 現行パスワードの控え | `~/owarihigashi-admin-password.txt` |

`npx vercel whoami` が `shun020921-2138` を返すこと、
`cat .vercel/project.json` の `projectName` が `owarihigashi-admin` であることを先に確認してください。
違っていたら `npx vercel link --project owarihigashi-admin --yes` でリンクし直します。

### 手順

**① 新しいパスワードとハッシュを作る**（値を画面に出さずファイルへ）

```bash
SCRATCH=$(mktemp -d)
node -e '
const { randomBytes, scryptSync } = require("node:crypto")
const fs = require("node:fs")
const W = "abcdefghijkmnpqrstuvwxyz23456789"
const pw = Array.from(randomBytes(20), b => W[b % W.length]).join("").replace(/(.{4})(?=.)/g, "$1-")
const salt = randomBytes(16)
fs.writeFileSync(process.env.HOME + "/owarihigashi-admin-password.txt",
  ["尾張東剣道連盟 ホームページ管理画面","",
   "管理画面URL : https://owarihigashi-admin.vercel.app/admin",
   "パスワード   : " + pw, "",
   "このパスワードをお母様にお渡しください。",""].join("\n"), { mode: 0o600 })
fs.writeFileSync(process.env.SCRATCH + "/hash.txt",
  "scrypt:" + salt.toString("hex") + ":" + scryptSync(pw.normalize("NFKC"), salt, 64).toString("hex"),
  { mode: 0o600 })
console.log("生成しました")
'
```

**② 環境変数を差し替える**

```bash
npx vercel env rm ADMIN_PASSWORD_HASH production --yes
printf '%s' "$(cat $SCRATCH/hash.txt)" | npx vercel env add ADMIN_PASSWORD_HASH production --yes
rm -rf "$SCRATCH"
```

**③ 再デプロイして反映**

```bash
npx vercel deploy --prod
```

**④ 確認**

新しいパスワードでログインできること、古いパスワードでログインできないことを確認します。
新しいパスワードは `~/owarihigashi-admin-password.txt` に上書きされています。

### あわせて SESSION_SECRET も変える場合

漏洩が疑われるときは、セッション署名鍵も変えてください。

```bash
SCRATCH=$(mktemp -d)
node -e 'require("node:fs").writeFileSync(process.env.SCRATCH+"/s.txt", require("node:crypto").randomBytes(32).toString("hex"), {mode:0o600})'
npx vercel env rm SESSION_SECRET production --yes
printf '%s' "$(cat $SCRATCH/s.txt)" | npx vercel env add SESSION_SECRET production --yes
rm -rf "$SCRATCH"
npx vercel deploy --prod
```

### GitHub トークンも無効化する場合

管理画面のトークンが漏れた疑いがあるときは、**先に GitHub 側で失効**させてください。

1. https://github.com/settings/tokens で `owarihigashi-admin` を **Delete**
2. 新しい classic token（scope は `repo` のみ）を発行
3. コピーした状態で `pbpaste > ~/gh-token.txt`
4. 差し替えて削除:

```bash
printf '%s' "$(cat ~/gh-token.txt | tr -d '\n\r ')" | npx vercel env add GITHUB_TOKEN production --force --yes
rm -f ~/gh-token.txt
npx vercel deploy --prod
```

トークンが漏れた場合、リポジトリに不正なコミットが入っていないかも確認してください。

```bash
git log --oneline -20 makiko921217/owarihigashi-website 2>/dev/null || gh api "repos/makiko921217/owarihigashi-website/commits?sha=main" --jq '.[0:20][] | .sha[0:7] + "  " + .commit.author.date + "  " + (.commit.message | split("\n")[0])'
```

身に覚えのないコミットがあれば `git revert` で戻せます。
**サイト本体は別アカウント・別プロジェクトなので、管理画面側が侵害されても
公開サイトの Vercel 設定やドメインには手が出せません**（できるのはリポジトリへのコミットまで）。

## GitHub トークンが期限切れになったら

管理画面に「GITHUB_TOKEN が無効か期限切れです。」と出ます。サイト本体は影響を受けません。
手順1でトークンを作り直し、`vercel env rm` / `add` して再デプロイしてください。

---

## セキュリティの設計

| 項目 | やっていること |
| --- | --- |
| パスワードの保存 | 平文は保存しない。scrypt でハッシュ化した値だけを環境変数に置く |
| 照合 | `timingSafeEqual` で定数時間比較。scrypt 自体が遅いので総当たりのコストも上がる |
| セッション | HMAC-SHA256 署名付きトークン。HttpOnly / Secure / SameSite=Strict / 本番は `__Host-` 接頭辞 |
| 有効期限 | 14日。パスワード変更で即時失効 |
| 総当たり対策 | 15分に5回失敗で15分ロック |
| 経路のガード | `proxy.ts` で `/admin` 配下を弾き、**さらに**各 Server Action 内で `requireAdmin()` を呼ぶ |
| アップロード | PDF のみ（拡張子と先頭バイト `%PDF-` の両方を確認）、10MB 上限、ファイル名はサーバー側で安全化 |
| 保存内容の検証 | zod で型・長さ・件数を検証。PDF の URL は `/...` と `https://...` のみ許可 |
| 上書き事故の防止 | 保存前に GitHub 上のファイルの SHA を照合し、他所で更新されていたら中止する |
| 秘密情報の置き場 | すべてあなたの Vercel アカウント内。本番サイト側には一切置かない |
| 検索エンジン | 管理画面デプロイは `robots.txt` で全面拒否 ＋ `X-Robots-Tag: noindex` |

### さらに固めるなら

- **Vercel Firewall** で `/admin/login` にレート制限ルールを足す
  （現在の総当たり対策はサーバーインスタンス単位のメモリなので、これが本命の防波堤になります）
- GitHub トークンを専用の bot アカウントに分ける

---

## データの実体

| 場所 | 中身 |
| --- | --- |
| `data/content.json` | 行事予定と審査ボタンの定義 |
| `public/pdf/*.pdf` | 管理画面からアップロードされた PDF |
| `public/*.pdf` | 以前から手で置いてある PDF（そのまま使えます） |

サイト本体はこの JSON を**ビルド時に**読み込みます。ファイルが壊れているとビルドが
失敗するので、おかしな内容が本番に出ることはありません。
