export function tronWebCall(TronWeb) {
  return new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: {
      'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY,
    },
  });
}

export function getAddressByPrivateKey(web3, private_key) {
  const getAddress = web3.eth.accounts.privateKeyToAccount(private_key);
  return getAddress.address;
}
