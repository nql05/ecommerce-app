import express from 'express';
const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('E-commerce backend running (TypeScript)');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
