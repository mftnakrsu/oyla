---
title: Katılmak
description: Katılımcılar bir sunuma telefonlarından nasıl katılır ve sorulara nasıl cevap verir?
---

Katılımcıların tek ihtiyacı bir tarayıcı ve ekrandaki katılım kodu. Uygulama yüklemek, hesap
açmak ya da isim yazmak gerekmez.

## Sunuma katılın

Şu yollardan birini kullanın:

- **Kodu yazın.** Ekranda gösterilen adresi açın (örneğin `oyla.mefby.com`), **Ekrandaki kodu
  girin** başlığının altına 6 haneli kodu yazın ve **Katıl**'a dokunun.
- **QR kodu okutun.** Sunum ekranındaki QR kod sizi doğrudan sunuma götürür.
- **Katılım linkini açın.** Sunum yapan kişi, düzenleyicideki **Katılım linkini kopyala**
  düğmesiyle `https://oyla.mefby.com/join/859847` gibi bir link paylaşabilir.

<div class="screens">
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-home-tr-light.png"
    alt="Oyla ana sayfasında, katılım alanına kod yazılmış ve altında Katıl düğmesi bulunan bir telefon"
    width="1170"
    height="1992"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-mc-tr-light.png"
    alt="'Soru 1 / 4' satırı, soru, dört seçenek ve Oyu gönder düğmesini gösteren bir telefon"
    width="1170"
    height="1992"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-thanks-tr-light.png"
    alt="Kırmızı bir Oylandı damgası ve Cevabınız gönderildi başlığını gösteren bir telefon"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

Kod yanlışsa telefonda **Kod bulunamadı** yazısı ve **Başka bir kod girin** düğmesi çıkar.

## Soruyu cevaplayın

Katıldıktan sonra, sunum yapan kişi bir soru açana kadar telefonda **Katıldınız** yazar. Bundan
sonra telefon sunumu takip eder: sunum yapan kişi sonraki soruya geçtiğinde telefon da geçer.

1. Soruyu okuyun. Hemen üstündeki satır kaçıncı soruda olduğunuzu gösterir, örneğin
   "Soru 1 / 4".
2. Cevabınızı seçin ya da yazın.
3. Gönder düğmesine dokunun: çoktan seçmelide **Oyu gönder**, kelime bulutunda ve açık uçlu
   sorularda **Gönder**, ölçekte **Puanı gönder**.

Ardından telefonda **Cevabınız gönderildi** yazar ve büyük ekranı izlemeniz istenir. Gönderilen
cevap sonradan değiştirilemez. Sonuçlar telefonlarda değil, sunum ekranında görünür.

Kelime bulutu ve açık uçlu sorularda kişi başına birden fazla cevaba izin verilebilir. Bu durumda
teşekkür ekranında **Bir cevap daha ekle (2 hak kaldı)** gibi bir düğme bulunur.

## Karşılaşabileceğiniz mesajlar

| Mesaj | Anlamı |
|---|---|
| **Sunucu başka bir soruya geçti.** | Cevabınızı, sunum yapan kişi soruyu değiştirdikten hemen sonra gönderdiniz. Yeni soru artık ekranınızda. |
| **Bu soruyu zaten cevapladınız.** | Bu sorunun izin verdiği bütün cevap haklarını kullandınız. |
| **Bu soru artık cevap kabul etmiyor.** | Soru, soru başına sınır olan 2.000 cevaba ulaştı. |
| **Çok fazla istek gönderildi. Biraz bekleyip tekrar deneyin.** | Telefonunuzdan çok hızlı cevap ya da katılma denemesi geldi. |
| **Bağlantı koptu. Yeniden bağlanılıyor…** | Telefonun bağlantısı koptu. Kendiliğinden yeniden bağlanır ve güncel soruyu tekrar gösterir. |
| **Bu sunum sona erdi** | Sunum yapan kişi sunumu sildi. |

## Cevaplarınız ve yeniden bağlanma

Bir tarayıcı ilk kez katıldığında Oyla, tarayıcının yerel depolamasına (local storage) rastgele bir
katılımcı kimliği kaydeder. Sunucu cevapları bu kimlikle birbirinden ayırır. Ekranı kilitlenen,
sayfası yenilenen ya da bağlantısı kopan bir telefonun cevapları bu sayede kaybolmaz; aynı soru
size iki kez sorulmaz.

Cevaplar anonimdir: Oyla isim ya da e-posta adresi istemez. Tarayıcı verilerini silen biri yeni bir
kimlik alır ve yeniden cevap verebilir. Bu, hesapsız çalışmanın bilerek kabul edilmiş bir
bedelidir; ayrıntılar [Güvenlik](/oyla/tr/security/#anonymous-participants) sayfasında.

## Dil

Arayüz tarayıcınızın dilini (Türkçe ya da İngilizce) izler. Sayfanın üstündeki **EN / TR**
düğmesiyle dili değiştirebilirsiniz; tarayıcı seçiminizi hatırlar.
