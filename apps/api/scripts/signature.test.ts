import { createHmac } from 'crypto';
import { PaymentsService } from '../src/payments/payments.service';

const svc = new PaymentsService();
process.env.SAFEPAY_SECRET = 'top-secret';
const body = JSON.stringify({ orderNumber: 'VNL-ABC', status: 'paid' });

const good = createHmac('sha256', 'top-secret').update(body).digest('hex');
const bad = createHmac('sha256', 'wrong').update(body).digest('hex');

function eq(name: string, got: boolean, want: boolean) {
  const ok = got === want;
  console.log((ok ? '✓' : '✗') + ' ' + name);
  if (!ok) process.exitCode = 1;
}

eq('valid signature accepted', svc.verifySignature(body, good), true);
eq('wrong-secret signature rejected', svc.verifySignature(body, bad), false);
eq('missing signature rejected', svc.verifySignature(body, undefined), false);
eq('tampered body rejected', svc.verifySignature(body + 'x', good), false);
eq('short signature rejected', svc.verifySignature(body, 'deadbeef'), false);
eq('garbage signature rejected', svc.verifySignature(body, 'ZZ'), false);

if (!process.exitCode) console.log('\nAll signature assertions passed.');
