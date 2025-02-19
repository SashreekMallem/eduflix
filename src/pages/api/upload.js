
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }
      console.log({ fields, files });
      res.status(200).json({ received: true });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}