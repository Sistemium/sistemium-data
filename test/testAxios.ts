import http from 'http';
import { AddressInfo } from 'net';
import FormData from 'form-data';
import { AxiosError, AxiosHeaders } from 'axios';
import { expect } from './chai';
import defaultAxios, {
  adapterHeaders,
  axiosInstance,
  RAW_HEADERS_OPTION,
  serializeParams,
  settle,
} from '../src/util/axios';

describe('Axios utils', function () {

  it('should serialize params like axios 0.x', function () {
    const date = new Date('2024-01-02T03:04:05.000Z');
    expect(serializeParams({ name: 'John Doe', age: 5, active: true }))
      .equals('name=John+Doe&age=5&active=true');
    expect(serializeParams({ ids: ['a', 'b'] })).equals('ids[]=a&ids[]=b');
    expect(serializeParams({ id: { $in: ['a1', 'b2'] } }))
      .equals('id=%7B%22$in%22:[%22a1%22,%22b2%22]%7D');
    expect(serializeParams({ ts: date })).equals('ts=2024-01-02T03:04:05.000Z');
    expect(serializeParams({ a: null, b: undefined, c: 0, d: '' })).equals('c=0&d=');
    expect(serializeParams([{ $limit: 10 }])).equals('0=%7B%22$limit%22:10%7D');
    expect(serializeParams({ q: 'ä & = ? # / +' })).equals('q=%C3%A4+%26+%3D+%3F+%23+%2F+%2B');
    expect(serializeParams(new URLSearchParams({ a: 'b c' }))).equals('a=b+c');
  });

  it('should use the params serializer in own instances', function () {
    const params = { id: { $in: ['a'] } };
    expect(defaultAxios.getUri({ url: '/p', params })).equals('/p?id=%7B%22$in%22:[%22a%22]%7D');
    expect(axiosInstance({}).getUri({ url: '/p', params })).equals('/p?id=%7B%22$in%22:[%22a%22]%7D');
  });

  it('should restore original header values for adapters', function () {
    const session = { id: 's1' };
    const headers = adapterHeaders({
      headers: new AxiosHeaders({ accept: 'json', 'x-page-size': '10' }),
      [RAW_HEADERS_OPTION]: { 'x-page-size': 10, session },
    });
    expect(headers).to.deep.equal({ accept: 'json', 'x-page-size': 10, session });
    expect(headers.session).equals(session);
  });

  it('should settle', async function () {
    const config = { validateStatus: (status: number) => status < 300 };
    const run = (status: number) => new Promise((resolve, reject) => {
      settle(resolve, reject, { status, config, data: status, headers: {} });
    });
    expect(await run(200)).to.include({ data: 200 });
    const notFound = await run(404).catch(e => e);
    expect(notFound).to.be.instanceOf(AxiosError);
    expect(notFound).to.include({ code: AxiosError.ERR_BAD_REQUEST, message: 'Request failed with status code 404' });
    expect(notFound.response.status).equals(404);
    const failed = await run(503).catch(e => e);
    expect(failed).to.include({ code: AxiosError.ERR_BAD_RESPONSE, isAxiosError: true });
  });

  it('should post multipart form-data', async function () {

    const server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({
          contentType: req.headers['content-type'],
          body: Buffer.concat(chunks).toString(),
        }));
      });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

    try {
      const { port } = server.address() as AddressInfo;
      const form = new FormData();
      form.append('field', 'value');
      form.append('file', Buffer.from('file-content'), { filename: 'audio.wav', contentType: 'audio/wav' });
      // read before posting: sending consumes the form
      const expectedBody = form.getBuffer().toString();

      const { data } = await defaultAxios.post(`http://127.0.0.1:${port}/upload`, form, {
        headers: form.getHeaders(),
      });

      expect(data.contentType).equals(`multipart/form-data; boundary=${form.getBoundary()}`);
      expect(data.body).equals(expectedBody);
      expect(data.body).to.include('name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\nfile-content');
    } finally {
      server.close();
    }

  });

});
