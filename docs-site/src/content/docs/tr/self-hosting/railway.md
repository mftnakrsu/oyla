---
title: Railway
description: Oyla'yı kalıcı bir disk ve kendi alan adınızla Railway'de yayınlayın.
---

[Railway](https://railway.com), Dockerfile'ı doğrudan GitHub'dan derler; HTTPS ve WebSocket
desteği hazır gelir ve servise kalıcı bir disk (volume) bağlayabilirsiniz. `oyla.mefby.com`
adresindeki herkese açık kurulum da bu şekilde çalışıyor. Railway'in Hobby planında aylık
yaklaşık 5 dolar ödemeyi bekleyin.

## Başlamadan önce

- Bir Railway hesabı.
- Oyla deposunun, Railway'in erişebildiği bir GitHub hesabında bulunması. `mftnakrsu/oyla`
  deposunun bir fork'u iş görür ve güncellemeleri ne zaman alacağınıza siz karar verirsiniz.
- Kendi alan adınızı kullanacaksanız alan adınızın DNS ayarlarına erişim.

## 1. Servisi oluşturun

1. Railway'de yeni bir proje oluşturun ve **Deploy from GitHub repo**'yu seçin.
2. Oyla deposunu seçin.

Railway `Dockerfile`'ı bulur ve derler. Depodaki `railway.json` dosyası Railway'e Dockerfile'ı
kullanmasını söyler ve sağlık kontrolü (healthcheck) yolunu `/api/health` olarak ayarlar; böylece
yeni bir sürüm ancak sunucu cevap verdiğinde yayına girer.

`PORT` değişkenini ayarlamanız gerekmez: Railway bu değişkeni kendisi verir, Oyla da onu dinler.

## 2. Volume ekleyin

Volume olmadan her yeni sürüm boş bir veritabanıyla başlar.

1. Oyla servisine bir **Volume** ekleyin.
2. Bağlama yolunu (mount path) `/data` olarak ayarlayın.

İmaj veritabanını `/data/oyla.db` konumunda tuttuğu için başka bir şeyi değiştirmeniz gerekmez.

## 3. Değişkenleri ayarlayın

Servisin **Variables** sekmesine şunları ekleyin:

| Değişken | Değer | Neden |
|---|---|---|
| `OYLA_TRUST_PROXY` | `true` | Oyla'nın önünde Railway'in proxy'si var. Bu ayar sayesinde hız sınırları proxy'nin değil, her ziyaretçinin kendi adresine göre uygulanır. |
| `RAILWAY_RUN_UID` | `0` | Railway volume'ları root kullanıcısıyla bağlar; imaj ise `/data`'ya yazamayan, root olmayan bir kullanıcıyla çalışır. Bu ayar konteyneri root olarak çalıştırır ve veritabanı oluşturulabilir. |
| `OYLA_CREATE_PASSWORD` | uzun bir şifre | İsteğe bağlı. Yalnızca şifreyi bilenler sunum oluşturabilir; katılım herkese açık kalır. |

Değişken değişiklikleri bir sonraki dağıtımda (deploy) geçerli olur; Railway önerdiğinde
değişiklikleri dağıtın.

## 4. Alan adınızı ekleyin

Railway, ilk deneme için kullanışlı olan bir `*.up.railway.app` adresi üretebilir. Kendi alan
adınız için, örneğin `oyla.mefby.com`:

1. Servisin **Settings** bölümünü açın ve **Networking** kısmına gidin.
2. Özel alan adı (custom domain) ekleyin ve adresi girin.
3. Railway size bir CNAME kaydı gösterir. Bu kaydı DNS sağlayıcınızda oluşturun: ad alt alan
   adıdır (`oyla`), değer ise Railway'in gösterdiği hedeftir.
4. Railway alan adını etkin gösterene kadar bekleyin. HTTPS sertifikasını kendisi alır.

Sunum ekranı hangi adreste açıldıysa onu gösterir. **… adresine gidin ve … kodunu girin**
yazısında ve QR kodda kendi alan adınızın görünmesi için sunum ekranını o adreste açın.

## 5. Kurulumu kontrol edin

- `https://alan-adiniz/api/health` adresi `{"status":"ok"}` döndürüyor olmalı.
- Bir sunum oluşturun, sunum ekranını açın ve telefonunuzdan katılın. Herkese açık yolu denemek
  için aynı Wi-Fi yerine mobil veriyi kullanın.
- Servisi bir kez yeniden dağıtın ve sunumun hâlâ yerinde olduğunu kontrol edin. Kaybolduysa
  volume `/data` yoluna bağlı değildir.

## Güncellemeler

Railway, bağlı dal (branch) değiştiğinde servisi yeniden dağıtır. Fork kullanıyorsanız yeni sürümü
almak için fork'unuzu asıl depoyla eşitleyin. Veriler volume'da kalır, veritabanı geçişleri
(migration) yeni sürüm başlarken çalışır.

## Diğer barındırma seçenekleri

Railway seçeneklerden yalnızca biri. Oyla şu koşulları sağlayan her ortamda çalışır:

- Docker imajı derleyip çalıştırabiliyor (ya da Node.js 24 sunuyor),
- WebSocket destekliyor ve
- `/data` için kalıcı bir disk sağlıyor.

Fly.io, Render, Docker kurulu küçük bir VPS ya da ters proxy arkasındaki bir ev sunucusu bu
koşulları karşılar. Hangisini seçerseniz seçin tek bir kopya çalıştırın, HTTPS kullanın ve
[`OYLA_TRUST_PROXY`](/oyla/tr/self-hosting/configuration/#oyla_trust_proxy) değerini önündeki
proxy sayısına göre ayarlayın. Ters proxy örneklerini İngilizce
[Docker sayfasında](/oyla/tr/self-hosting/docker/) bulabilirsiniz.
