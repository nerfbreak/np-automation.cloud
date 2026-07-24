# Panduan Desain Layout & Animasi

Semua perubahan layout, UI, komponen, dan animasi wajib merujuk ke referensi utama:

1. **Komponen & Layout**: [Shadcn Studio Components](https://shadcnstudio.com/components)
2. **Animasi & Interaksi**: [Shadcn Studio Getting Started](https://shadcnstudio.com/docs/getting-started/introduction)

## Aturan Implementasi

### 1. Struktur Layout
- Menggunakan Sidebar Modern (collapsible, responsive).
- Dashboard menggunakan Bento Grid atau grid seragam untuk data visual.
- Layout data tabel menggunakan Card wrapper dengan overflow horizontal yang aman.

### 2. Animasi & Transisi
- Animasi menggunakan Framer Motion atau Tailwind Animate.
- Transisi halus untuk perpindahan state (loading, error, success).
- Interaksi micro-interaction pada button, hover card, dan dialog popup.

### 3. Batasan Desain & Larangan Glassmorphism
- **DILARANG KERAS menggunakan efek Glassmorphism** (misalnya `backdrop-blur`, `bg-opacity`, border semi-transparan yang memicu blur, overlay transparan kabur).
- Semua komponen wajib memiliki warna solid: `bg-background`, `bg-card`, atau warna solid sejenis yang tidak tembus pandang.
- Menggunakan border solid tipis dengan outline yang tegas untuk pemisah layout.
- Tidak boleh menambahkan library UI pihak ketiga baru tanpa persetujuan, utamakan standard Tailwind CSS, Radix UI, dan Shadcn UI yang sudah terpasang.
- Warna dan spacing harus konsisten menggunakan utility class Tailwind.


