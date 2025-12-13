import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 8080;

// Servir a pasta 'dist' gerada pelo Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Redirecionar todas as requisições para index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
