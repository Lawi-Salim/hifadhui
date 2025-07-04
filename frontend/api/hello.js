export default function handler(req, res) {
  console.log('API hello appelée');
  res.status(200).json({ message: 'Hello from API' });
} 