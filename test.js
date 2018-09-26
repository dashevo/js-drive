const { client: jaysonClient } = require('jayson');

const cli = jaysonClient.http({
  port: '6000',
});
cli.request('getSyncInfo', [], (r) => {
  console.log('>>>>', r);
});
