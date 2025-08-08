/*
⚠️ PERINGATAN:
Script ini **TIDAK BOLEH DIPERJUALBELIKAN** dalam bentuk apa pun!

╔══════════════════════════════════════════════╗
║                🛠️ INFORMASI SCRIPT           ║
╠══════════════════════════════════════════════╣
║ 📦 Version   : 1.0.5
║ 👨‍💻 Developer  : Azhari Creative              ║
║ 🌐 Website    : https://autoresbot.com       ║
║ 💻 GitHub     : github.com/autoresbot/resbot-ai
╚══════════════════════════════════════════════╝

📌 Mulai 11 April 2025,
Script **Autoresbot** resmi menjadi **Open Source** dan dapat digunakan secara gratis:
🔗 https://autoresbot.com
*/

const moment= require("moment-timezone")

const config = {
    AutoUpdate          : 'off', // on atau off
    API_KEY             : 'betataster1', 
    GEMINI_API_KEY      : 'AIzaSyAQXZcAUQB4Lr4dURTdi3vYUlzkc_MDTK4',
    phone_number_bot    : '6283197977804', // Nomor BOT
    type_connection     : 'qr', // qr atau pairing
    bot_destination     : 'private', // group , private, both
    name_bot            : 'Resbot Ai',
    owner_name          : 'Bold',
    owner_number        : '6289512822345',
    owner_website       : 'profil.boldstore.my.id',
    version             : global.version,
    rate_limit          : 300, // 3 detik
    total_limit         : 100, // limit perhari -  user biasa || kalo premium unlimited
    sticker_packname    : 'Bold',
    sticker_author      : `Date: ${moment.tz('Asia/Jakarta').format('DD/MM/YY')}\Owner 0895-1282-2345`,
    notification        : {
        limit           : 'Hai kak, Limit harian anda sudah habis silakan tunggu besok ya atau berlangganan premium untuk menikmati fitur tanpa limit',
        reset           : 'Dialog berhasil dihapus. Semua percakapan kita telah di-reset dan siap memulai dari awal!',
        ig              : 'kirimkan link instagramnya ya kak',
        fb              : 'kirimkan link facebooknya ya kak',
        tt              : 'kirimkan link tiktoknya ya kak',
        waiting         : 'Hai kak mohon tunggu beberapa saat lagi ya, proses sebelumnya belum selesai',
        qc_help         : 'Tulis textnya ya kak, misal *qc halo*',
        only_owner      : '_❗Perintah Ini Hanya Bisa Digunakan Oleh Owner !_'
        
    },
    success             : {
        hd : 'Ini kak hasil gambarnya, Maaf kalau masih blur',
    },
    error               : {
       FILE_TOO_LARGE : `File terlalu besar. Maksimal ukuran file adalah 99 Mb`,
       THROW          : '_Ada masalah saat terhubung ke server_',
       PLAY_ERROR     : 'Yahh Gagal, Sepertinya ada masalah saat mendowload audio',
       HD_ERROR       : 'Yahh Gagal, Mohon maaf kak, tidak bisa hd in gambar',
       IMAGE_ERROR    : 'Yahh Gagal, Mohon maaf kak, tidak bisa carikan kamu gambar',
       qc             : 'Yah gagal bikin qc nya kak'
    }
}; 

module.exports = config;