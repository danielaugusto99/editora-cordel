const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'livros.json');

// Senha simples para o painel administrativo (você pode alterar depois)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cordel2026';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar para ler os livros do arquivo JSON
function readBooks() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

// Função auxiliar para salvar os livros no arquivo JSON
function saveBooks(books) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2), 'utf-8');
}

// 1. Listar todos os livros (Público)
app.get('/api/livros', (req, res) => {
  const books = readBooks();
  res.json(books);
});

// 2. Buscar um livro específico pelo ID (Público)
app.get('/api/livros/:id', (req, res) => {
  const books = readBooks();
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Livro não encontrado' });
  res.json(book);
});

// 3. Cadastrar um novo livro (Protegido por senha)
app.post('/api/livros', (req, res) => {
  const { password, book } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha administrativa incorreta.' });
  }

  if (!book || !book.title || !book.author) {
    return res.status(400).json({ error: 'Título e autor são obrigatórios.' });
  }

  const books = readBooks();
  const nextId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;

  const newBook = {
    id: nextId,
    title: book.title,
    author: book.author,
    category: book.category || 'Literatura',
    year: book.year || new Date().getFullYear().toString(),
    pages: parseInt(book.pages) || 0,
    isbn: book.isbn || 'Em registro',
    coverBg: book.coverBg || '#8C4A32',
    coverText: book.coverText || '#F6F1EA',
    synopsis: book.synopsis || '',
    amazonUrl: book.amazonUrl || '#',
    estanteUrl: book.estanteUrl || '#',
    martinsUrl: book.martinsUrl || '#'
  };

  books.push(newBook);
  saveBooks(books);

  res.status(201).json({ message: 'Livro cadastrado com sucesso!', book: newBook });
});

// 4. Excluir um livro (Protegido por senha)
app.delete('/api/livros/:id', (req, res) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha administrativa incorreta.' });
  }

  let books = readBooks();
  const initialLength = books.length;
  books = books.filter(b => b.id !== parseInt(req.params.id));

  if (books.length === initialLength) {
    return res.status(404).json({ error: 'Livro não encontrado.' });
  }

  saveBooks(books);
  res.json({ message: 'Livro removido com sucesso.' });
});

app.listen(PORT, () => {
  console.log(`Servidor da Editora Cordel rodando em http://localhost:${PORT}`);
});