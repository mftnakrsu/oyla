---
title: Soru tipleri
description: Çoktan seçmeli, kelime bulutu, açık uçlu soru ve ölçek; ayarları, sınırları ve sonuçlarıyla.
---

Oyla'da dört soru tipi var. Her sorunun en fazla 200 karakterlik bir başlığı olur; diğer ayarlar
tipe göre değişir. Tipi soruyu eklerken seçersiniz ve sonradan değiştiremezsiniz. Başka bir tipe
ihtiyacınız olursa soruyu silip yenisini ekleyin.

| Tip | Kişi başı cevap | Ekrandaki sonuç |
|---|---|---|
| [Çoktan seçmeli](#çoktan-seçmeli) | 1 | Yüzde ve oy sayısıyla çubuklar |
| [Kelime bulutu](#kelime-bulutu) | 1-5 (varsayılan 3) | Ne kadar çok kişi yazdıysa o kadar büyüyen kelimeler |
| [Açık uçlu soru](#açık-uçlu-soru) | 1-5 (varsayılan 1) | En yenisi başta, not kâğıdı görünümünde cevaplar |
| [Ölçek](#ölçek) | 1 | Ortalama ve puanların sütun grafiği |

## Çoktan seçmeli

Herkes bir seçenek seçer.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-mc-tr-light.png"
    alt="Çoktan seçmeli sonuçlar: Çevrimdışı mod, Karanlık mod, CSV dışa aktarma ve Takım alanları için dört yatay çubuk"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-mc-tr-light.png"
    alt="Telefon formu: seçilebilecek dört seçenek ve Oyu gönder düğmesi"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Ayarlar:** 2 ile 10 arasında **Seçenekler**, her biri en fazla 80 karakter. Listeyi **Seçenek
ekle** düğmesiyle ve seçeneklerin yanındaki × ile düzenlersiniz. Boş bırakılan seçenekler
"1. seçenek", "2. seçenek" diye görünür.

**Sonuçlar:** her seçenek için yüzdesini ve oy sayısını gösteren bir çubuk, ayrıca toplam oy.
Bütün çubuklar tek renktir ve her çubuğun üstünde etiketi yazar; böylece grafik renk körlüğü olan
izleyiciler için de, soluk projeksiyonlarda da rahat okunur.

Her seçeneğin değişmeyen bir iç kimliği vardır. Bir seçeneği yeniden adlandırmak ya da yeni
seçenek eklemek verilmiş oyları korur; kaldırılan bir seçeneğin oyları ise artık sayılmaz.

## Kelime bulutu

Katılımcılar kısa cevaplar gönderir. Aynı cevabı ne kadar çok kişi verirse o kelime o kadar büyür.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-cloud-tr-light.png"
    alt="Kelime bulutu: en büyük yazıyla ivme ve büyüme, çevrelerinde yoğun, öğretici ve heyecanlı gibi daha küçük kelimeler"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-cloud-tr-light.png"
    alt="Telefon formu: içinde ivme yazan bir metin alanı ve Gönder düğmesi"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Ayarlar:** 1 ile 5 arasında **Kişi başı cevap sayısı** (varsayılan 3).

**Cevaplar:** 1 ile 25 karakter arası. Baştaki ve sondaki boşluklar silinir, art arda gelen
boşluklar teke indirilir.

**Sonuçlar:** en sık verilen 100 cevap. Büyük-küçük harf ayrımı yapılmadan gruplanır; yani
"Pizza" ile "pizza" tek kelime sayılır ve ekranda ilk gelen yazım gösterilir.

## Açık uçlu soru

Katılımcılar serbest metin yazar, cevaplar ekranda not kâğıtları olarak belirir.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-open-tr-light.png"
    alt="Not kâğıdı görünümünde açık uçlu cevaplar; örneğin 'Her cuma demo' ve 'Kısa toplantılar'"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-open-tr-light.png"
    alt="Telefon formu: içinde bir cevap yazan metin alanı, kalan karakter sayacı ve Gönder düğmesi"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Ayarlar:** 1 ile 5 arasında **Kişi başı cevap sayısı** (varsayılan 1).

**Cevaplar:** en fazla 280 karakter. Satır sonları korunur.

**Sonuçlar:** en yenisi başta olmak üzere son 200 cevap ve toplam cevap sayısı. Henüz moderasyon
yok: her cevap gelir gelmez ekranda görünür. Kalabalık ya da tanımadığınız bir dinleyici kitlesi
karşısında bunu aklınızda tutun.

## Ölçek

Katılımcılar bir ifadeyi düşükten yükseğe puanlar.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-scale-tr-light.png"
    alt="Ölçek sonuçları: büyük yazıyla ortalama ve 1'den 5'e kadar her puan için bir sütun, uçlarda Hiç hazır değil ve Tamamen hazır etiketleri"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-scale-tr-light.png"
    alt="Telefon formu: 4'ün seçili olduğu 1'den 5'e sayı düğmeleri, uç etiketleri ve Puanı gönder düğmesi"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Ayarlar:**

- **En düşük**: 0 ya da 1 (varsayılan 1).
- **En yüksek**: 2 ile 10 arası (varsayılan 5).
- **En düşük değerin etiketi** ve **En yüksek değerin etiketi**: isteğe bağlı, her biri en fazla
  40 karakter; örneğin "Hiç" ve "Tamamen".

**Sonuçlar:** tek ondalık basamaklı ortalama, cevap sayısı ve her değeri kaç kişinin seçtiğini
gösteren birer sütun. Cevaplar geldikten sonra aralığı değiştirirseniz yeni aralığın dışında kalan
puanlar artık sayılmaz.

## Bütün tipler için sınırlar

| Sınır | Değer |
|---|---|
| Sunum adı | 120 karakter |
| Soru başlığı | 200 karakter |
| Sunum başına soru | 50 |
| Soru başına cevap (bütün katılımcılar toplamı) | 2.000 |

## Aradığınız tip yok mu?

Bilgi yarışması (quiz), oylanabilen soru-cevap ve çok ifadeli ölçekler
[yol haritasında](/oyla/tr/roadmap/). Birini kendiniz geliştirmek isterseniz
[Soru tipi eklemek](/oyla/tr/development/adding-a-question-type/) rehberiyle başlayın (İngilizce).
