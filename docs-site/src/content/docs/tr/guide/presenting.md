---
title: Sunum yapmak
description: Sunum oluşturun, soru ekleyin, yönetici linkini saklayın ve sunum ekranını kullanın.
---

Bu sayfa bir oturumu sunum yapan kişinin gözünden anlatıyor: sunumu oluşturur, soruları eklersiniz,
sunum ekranını projeksiyona yansıtırsınız ve katılımcılar cevap verirken sorular arasında
ilerlersiniz.

## Sunum oluşturun

1. Oyla sunucunuzu tarayıcıda açın; örneğin `http://localhost:3000` ya da kendi alan adınız.
   Henüz bir sunucunuz yoksa [Docker](/tr/self-hosting/docker/) sayfasına bakın.
2. **Oturum başlatın** bölümünde **Sunum oluştur**'u seçin.
3. Bir ad girin (en fazla 120 karakter) ve **Sunum oluştur**'u seçin.

Sunucuyu çalıştıran kişi bir şifre belirlediyse form ayrıca **Sunucu şifresi** ister. Katılmak ve
cevap vermek için hiçbir zaman şifre gerekmez; şifre yalnızca sunum oluşturmayı korur.

<img
  class="shot"
  src="/screenshots/home-tr-light.png"
  alt="Ana sayfa: solda büyük bir katılım kodu alanı, sağda Sunum oluştur düğmesinin bulunduğu Oturum başlatın paneli"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Yönetici linkini saklayın

Oyla'da hesap yok. Sunum oluşturduğunuzda size şuna benzeyen bir **yönetici linki** verilir:

```text
https://oyla.example.com/edit/AbC123xYz789#key=…
```

Düzenleyici bu linki bir kez, **Bu linki saklayın** kutusunda gösterir. **Yönetici linkini
kopyala**'yı seçin, linki güvenli bir yere kaydedin ve ardından **Kaydettim**'i seçin.

- Sunuma geri dönmenin tek yolu bu link. Linke sahip olan herkes sunumu düzenleyebilir, sunabilir
  ve silebilir; bu yüzden yalnızca birlikte sunum yaptığınız kişilerle paylaşın.
- Tarayıcınız sunumu ana sayfadaki **Sunumlarınız** listesinde **Aç** ve **Sunumu başlat** düğmeleriyle
  hatırlar. Bu liste yalnızca o tarayıcıda durur.
- Linki istediğiniz zaman düzenleyicinin altındaki **Yönetici linkini kopyala** düğmesiyle yeniden
  kopyalayabilirsiniz.

:::caution
Yönetici linkini kaybeder ve tarayıcı verilerinizi silerseniz link geri getirilemez. Sunucu, linkin
gizli kısmının yalnızca özetini (hash) saklar.
:::

## Soru ekleyin

<img
  class="shot"
  src="/screenshots/editor-tr-light.png"
  alt="Düzenleyici: solda dört soruluk liste, sağda seçili çoktan seçmeli soru ve dört seçeneği"
  width="2160"
  height="1350"
  loading="lazy"
/>

1. **Soru ekle**'yi seçin ve **Bir soru tipi seçin** ekranından bir tip belirleyin: çoktan
   seçmeli, kelime bulutu, açık uçlu soru ya da ölçek. Her birinin ne yaptığını
   [Soru tipleri](/tr/guide/question-types/) sayfasında bulabilirsiniz.
2. Sorunuzu **Soru** alanına yazın (en fazla 200 karakter).
3. Çoktan seçmeli bir sorunun seçenekleri gibi, o tipe özgü ayarları doldurun.

Değişiklikler, yazmayı bıraktıktan kısa bir süre sonra kendiliğinden kaydedilir; düzenleyici önce
**Kaydediliyor…**, ardından **Kaydedildi** yazar. Düzenleyicide ayrıca şunları yapabilirsiniz:

- Üst çubuktaki sunum adına tıklayarak sunumu yeniden adlandırmak.
- **Yukarı taşı** ve **Aşağı taşı** oklarıyla soruların sırasını değiştirmek.
- **Soruyu sil** ile bir soruyu kaldırmak. Düğme, onay için ikinci bir tıklama ister.
- Bir sorunun kaç cevap aldığını görmek (örneğin "Şu ana kadar 3 cevap") ve cevapları
  **Sonuçları sıfırla** ile temizlemek.

Bir sunumda en fazla 50 soru olabilir.

<img
  class="shot"
  src="/screenshots/editor-types-tr-light.png"
  alt="Soru tipi seçimi: Çoktan seçmeli, Kelime bulutu, Açık uçlu soru ve Ölçek kartları"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Tema seçin

Her sunumun bir renk teması vardır. Düzenleyicideki **Tema** bölümünde dört renk örneği bulunur:
**Zümrüt** (varsayılan), **İndigo**, **Lacivert ve turuncu**, **Klasik mavi**. Kullanmak
istediğiniz temayı seçmeniz yeterli.

Sunum ekranı da katılımcıların telefonları da sunumun temasını kullanır. Oturum sırasında temayı
değiştirirseniz bağlı telefonlar yeni renklere hemen geçer. Açık ya da koyu mod yine her cihazın
kendi ayarını izler; ana sayfa gibi bir sunuma ait olmayan sayfalar varsayılan temayla açılır.

## Sunun

Düzenleyicinin üst çubuğundaki **Sunumu başlat** düğmesini seçin (sunumda en az bir soru olduğunda
kullanılabilir). Sunum ekranı açılır ve henüz etkin bir soru yoksa ilk soruyla başlar. Bu pencereyi
projeksiyona yansıtın.

<img
  class="shot"
  src="/screenshots/present-mc-tr-light.png"
  alt="Sunum ekranı: üstte katılım adresi ve kodu ile bir QR kod, ortada çubuk grafik halinde sonuçlar, altta kontroller"
  width="2160"
  height="1350"
  loading="lazy"
/>

- Üst çubukta her zaman **_adres_ adresine gidin ve _kod_ kodunu girin** yazısı ve bir QR kod
  bulunur; geç gelenler istedikleri an katılabilir. Buradaki adres, sunum ekranını açtığınız
  adrestir. Bu adres `localhost` ise Oyla'yı telefonların erişebileceği bir adresle açın;
  örneğin alan adınızla ya da bilgisayarınızın yerel ağdaki adresiyle.
- Ortada etkin soru ve sonuçları yer alır. Sonuçlar cevaplar geldikçe güncellenir.
- Alt çubukta kaç kişinin bağlı olduğu (örneğin "25 kişi bağlı") ve kaçıncı soruda olduğunuz
  ("1 / 4") görünür.

Sağ alttaki düğmeler sırasıyla **Önceki soru**, **Sonraki soru**, **Sonuçları sıfırla**,
**Katılım bilgilerini göster**, **Tam ekran** ve **Düzenleyiciye dön**'dür.

### Klavye kısayolları

| Tuş | İşlev |
|---|---|
| <kbd>→</kbd>, <kbd>Page Down</kbd> ya da <kbd>Boşluk</kbd> | Sonraki soru |
| <kbd>←</kbd> ya da <kbd>Page Up</kbd> | Önceki soru |
| <kbd>F</kbd> | Tam ekranı açar ya da kapatır |
| <kbd>I</kbd> | Katılım bilgilerini gösterir ya da gizler |
| <kbd>Esc</kbd> | Katılım bilgilerini gizler |

Sunum kumandalarının çoğu Page Up ve Page Down gönderdiği için onlarla da ilerleyebilirsiniz.

### Katılım bilgileri

<kbd>I</kbd> tuşuna basın, üst çubuktaki QR koda tıklayın ya da **Katılım bilgilerini göster**'i
seçin: adres, katılım kodu ve büyük bir QR kod tüm ekranı kaplar. İnsanlar yerlerine yerleşirken
açılış ekranı olarak iyi iş görür. **Katılım bilgilerini gizle** düğmesi ya da <kbd>Esc</kbd>
tuşu ekranı kapatır.

<img
  class="shot"
  src="/screenshots/present-invite-tr-light.png"
  alt="Tam ekran katılım bilgileri: oyla.example.com adresi, çok büyük rakamlarla katılım kodu ve bir QR kod"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Sonuçları sıfırlayın

Sunum ekranındaki **Sonuçları sıfırla**, etkin sorunun bütün cevaplarını siler; düzenleyicideki
aynı adlı düğme ise bunu seçili soru için yapar. Daha önce cevap vermiş telefonlarda form yeniden
açılır ve tekrar cevap verilebilir. Bir deneme turundan sonra işinize yarar.

:::caution
Sonuçları sıfırla, birkaç saniye içinde tekrar tıklamanızı ister; ardından cevapları kalıcı olarak siler. Bu işlem geri alınamaz.
:::

## Oturum sırasında soruları değiştirin

Sunum yaparken düzenleyiciyi başka bir sekmede ya da pencerede açık tutabilirsiniz.

- Bir soruyu düzenlemek cevaplarını asla silmez. Etkin soruyu değiştirirseniz telefonlar yeni hâlini
  hemen görür.
- Çoktan seçmeli bir sorunun seçeneklerini yeniden adlandırmak ya da yeni seçenek eklemek mevcut
  oyları korur. Kaldırdığınız bir seçeneğe verilen oylar artık sayılmaz.
- Bir ölçeğin aralığını değiştirirseniz yeni aralığın dışında kalan puanlar artık sayılmaz.
- Sunumun adını ya da temasını değiştirdiğinizde de bağlı telefonlar bunu hemen görür.

## Ayrılın, sonra geri dönün

Sunum ekranını kapatmak oturumu bitirmez. Etkin soru etkin kalır ve telefonlar onu göstermeye
devam eder; böylece slaytlarınıza geçip sonra geri dönebilirsiniz. Etkin soru sunucuda saklandığı
için sunucu yeniden başlasa bile oturum kaldığı yerden devam eder.

Başka bir bilgisayardan sunmak için yönetici linkini o bilgisayarda açın ve **Sunumu başlat**'ı seçin.

## Sunumu silin

Düzenleyicinin altındaki **Sunumu sil** düğmesini seçin ve onaylamak için bir kez daha tıklayın.
Sunum, soruları ve bütün cevaplar silinir. Bağlı telefonlarda **Bu sunum sona erdi** yazısı
görünür.

Sunucular bir süredir kullanılmayan sunumları da kendiliğinden siler; varsayılan süre 30 gündür.
Sunumu açmak, düzenlemek ya da sunmak ve katılımcıların katılması ya da cevap vermesi kullanım
sayılır. Ayrıntılar için
[`OYLA_RETENTION_DAYS`](/tr/self-hosting/configuration/#oyla_retention_days) ayarına bakın.
