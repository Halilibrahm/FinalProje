import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import he from 'he';

export default function BilgiYarismasi() {
  const [sorular, setSorular] = useState([]);
  const [aktifSoru, setAktifSoru] = useState(0);
  const [puan, setPuan] = useState(0);
  const [yukleniyorMu, setYukleniyorMu] = useState(true);
  const [yanlisCevaplar, setYanlisCevaplar] = useState([]); // Yanlış cevapları tutma

  // Soruları çekme fonksiyonu
  const soruGetir = async () => {
    setYukleniyorMu(true);
    try {
      const response = await axios.get(
        'https://opentdb.com/api.php?amount=10&type=multiple'
      );

      // Soruları formatla
      const formatlanmisSorular = response.data.results.map(soru => ({
        soru: he.decode(soru.question),
        dogruCevap: he.decode(soru.correct_answer),
        kategori: soru.category, // Soru kategorisi
        secenekler: [
          ...soru.incorrect_answers.map(cevap => he.decode(cevap)),
          he.decode(soru.correct_answer)
        ].sort(() => Math.random() - 0.5)
      }));

      // İlk 5 soruyu al
      setSorular(formatlanmisSorular.slice(0, 5));
      setYukleniyorMu(false);
    } catch (error) {
      console.error("Soru getirme hatası:", error);
      Alert.alert("Hata", "Sorular yüklenemedi.");
      setYukleniyorMu(false);
    }
  };

  // İlk açılışta soruları getir
  useEffect(() => {
    soruGetir();
  }, []);

  // Cevap kontrol fonksiyonu
  const cevapKontrol = (secilenCevap) => {
    const mevcutSoru = sorular[aktifSoru];
    
    if (secilenCevap === mevcutSoru.dogruCevap) {
      setPuan(prevPuan => prevPuan + 20);
      Alert.alert("Doğru!", "Tebrikler, doğru cevap.");
    } else {
      // Yanlış cevabı kaydet
      setYanlisCevaplar(prevYanlisCevaplar => [
        ...prevYanlisCevaplar,
        { soru: mevcutSoru.soru, dogruCevap: mevcutSoru.dogruCevap, kategori: mevcutSoru.kategori }
      ]);
      Alert.alert("Yanlış!", `Doğru cevap: ${mevcutSoru.dogruCevap}`);
    }

    // Son soruya gelindiyse
    if (aktifSoru < 4) {
      setAktifSoru(prevSoru => prevSoru + 1);
    } else {
      // Yarışma bitişi
      öneriVer(yanlisCevaplar);
    }
  };

  // Öneri Verme Fonksiyonu
  const öneriVer = (yanlisCevaplar) => {
    const kategoriler = yanlisCevaplar.map(cevap => cevap.kategori);

    // Kategorileri sayalım
    const kategoriSayilari = kategoriler.reduce((acc, kategori) => {
      acc[kategori] = (acc[kategori] || 0) + 1;
      return acc;
    }, {});

    // En çok yanlış yapılan kategoriyi bulalım
    const enCokYanlisYapilanKategori = Object.keys(kategoriSayilari).reduce((a, b) => 
      kategoriSayilari[a] > kategoriSayilari[b] ? a : b
    );

    let öneriMetni = `Daha fazla çalışmanız gereken konu: ${enCokYanlisYapilanKategori}\n`;

    // Kategorilere özgü öneriler
    if (enCokYanlisYapilanKategori === "Science") {
      öneriMetni += "Fizik, kimya, biyoloji gibi temel konularda çalışabilirsiniz.";
    } else if (enCokYanlisYapilanKategori === "History") {
      öneriMetni += "Tarihin önemli dönemlerine çalışın, özellikle Orta Çağ ve Antik Yunan hakkında.";
    } else {
      öneriMetni += "Bu konuda daha fazla pratik yapmanız önerilir.";
    }

    Alert.alert("Çalışma Önerisi", öneriMetni, [
      {
        text: "Tekrar Oyna",
        onPress: () => {
          setAktifSoru(0);
          setPuan(0);
          setYanlisCevaplar([]);
          soruGetir();
        }
      }
    ]);
  };

  // Yüklenme durumu
  if (yukleniyorMu) {
    return (
      <SafeAreaView style={styles.yuklenmeContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Sorular yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // İçerik henüz yoksa
  if (sorular.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Soru bulunamadı.</Text>
        <TouchableOpacity onPress={soruGetir} style={styles.buton}>
          <Text style={styles.butonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Puan Gösterimi */}
      <View style={styles.puanKutusu}>
        <Text style={styles.puanText}>Puan: {puan}</Text>
        <Text style={styles.soruSayisiText}>
          Soru: {aktifSoru + 1}/5
        </Text>
      </View>

      {/* Soru Alanı */}
      <View style={styles.soruAlani}>
        <Text style={styles.soruText}>
          {sorular[aktifSoru].soru}
        </Text>
      </View>

      {/* Cevap Seçenekleri */}
      <View style={styles.secenekAlani}>
        {sorular[aktifSoru].secenekler.map((secenek, index) => (
          <TouchableOpacity
            key={index}
            style={styles.secenekButon}
            onPress={() => cevapKontrol(secenek)}
          >
            <Text style={styles.secenekText}>{secenek}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20
  },
  yuklenmeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  },
  puanKutusu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20
  },
  puanText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  soruSayisiText: {
    fontSize: 18
  },
  soruAlani: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  soruText: {
    fontSize: 16,
    textAlign: 'center'
  },
  secenekAlani: {
    width: '100%'
  },
  secenekButon: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  secenekText: {
    fontSize: 16
  },
  buton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 20
  },
  butonText: {
    color: 'white',
    textAlign: 'center'
  }
});
