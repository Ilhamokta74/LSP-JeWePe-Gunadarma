-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 21 Jun 2023 pada 09.50
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `jewepe`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `akun`
--

CREATE TABLE `akun` (
  `email` varchar(32) NOT NULL,
  `password` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `akun`
--

INSERT INTO `akun` (`email`, `password`) VALUES
('Ilham@gmail.com', '12341234');

-- --------------------------------------------------------

--
-- Struktur dari tabel `artikel`
--

CREATE TABLE `artikel` (
  `ID_artikel` int(32) NOT NULL,
  `judul` text NOT NULL,
  `artikel` text NOT NULL,
  `idname` text NOT NULL,
  `image` text NOT NULL,
  `artikelDepan` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `artikel`
--

INSERT INTO `artikel` (`ID_artikel`, `judul`, `artikel`, `idname`, `image`, `artikelDepan`) VALUES
(26, 'ilham oktavian', '232121231', 'ilham-oktavian', 'image-1687270116974.jpg', '232121231 ...'),
(27, 'ilham oktavian', 'ML/AI adalah kependekan dari Machine Learning dan Artificial Intelligence. Machine Learning (ML) adalah bidang dalam ilmu komputer yang berkaitan dengan pengembangan algoritma dan model statistik yang memungkinkan komputer untuk \"belajar\" dari data dan pengalaman untuk melakukan tugas-tugas tertentu tanpa harus secara eksplisit diprogram. Dalam ML, model dan algoritma dilatih dengan data yang tersedia, dan kemudian dapat digunakan untuk membuat prediksi, mengambil keputusan, atau menemukan pola dalam data baru. Artificial Intelligence (AI) merujuk pada kecerdasan yang ditambahkan pada sistem komputer untuk memungkinkannya melakukan tugas-tugas yang umumnya membutuhkan kecerdasan manusia. AI mencakup berbagai teknik, termasuk Machine Learning, untuk mencapai tujuan ini. AI bertujuan untuk membuat komputer mampu berpikir, belajar, merencanakan, memecahkan masalah, dan berinteraksi dengan manusia dengan cara yang serupa dengan manusia. Dalam konteks praktis, ML dan AI digunakan dalam berbagai aplikasi, seperti pengenalan wajah, penerjemahan otomatis, analisis data, prediksi peramalan, sistem rekomendasi, kendaraan otonom, dan masih banyak lagi. Tujuan utama dari ML dan AI adalah untuk memungkinkan komputer untuk melakukan tugas-tugas yang kompleks dan cerdas dengan efisien, tanpa memerlukan pemrograman eksplisit yang detail untuk setiap skenario.', 'ilham-oktavian', 'image-1687270135180.jpg', 'ML/AI adalah kependekan dari Machine Learning dan Artificial Intelligence. Machine Learning (ML) ada ...'),
(28, 'ilham oktavian', '23213', 'ilham-oktavian', 'image-1687333662853.jpg', '23213 ...');

-- --------------------------------------------------------

--
-- Struktur dari tabel `komentar`
--

CREATE TABLE `komentar` (
  `ID_artikel` varchar(32) NOT NULL,
  `nama` text NOT NULL,
  `email` varchar(32) NOT NULL,
  `komentar` text NOT NULL,
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `komentar`
--

INSERT INTO `komentar` (`ID_artikel`, `nama`, `email`, `komentar`, `id`) VALUES
('27', 'ilham', 'ilham@oktavian.com', '23432', 20),
('26', 'ilham', '32323', '23232323', 22),
('28', 'ilham', 'ilham@oktavian.com', '7878978987', 23);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `akun`
--
ALTER TABLE `akun`
  ADD PRIMARY KEY (`email`);

--
-- Indeks untuk tabel `artikel`
--
ALTER TABLE `artikel`
  ADD PRIMARY KEY (`ID_artikel`);

--
-- Indeks untuk tabel `komentar`
--
ALTER TABLE `komentar`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `artikel`
--
ALTER TABLE `artikel`
  MODIFY `ID_artikel` int(32) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT untuk tabel `komentar`
--
ALTER TABLE `komentar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
