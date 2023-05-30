export function tronWebCall(TronWeb) {
  return new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: {
      'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY,
    },
  });
}

export function getAddressByPrivateKeyWeb3(web3, private_key) {
  const getAddress = web3.eth.accounts.privateKeyToAccount(private_key);
  return getAddress.address;
}

export function convertToSatoshi(value) {
  return Math.round(value * 100000000);
}

export function convertFromSatoshi(value) {
  return parseFloat(value) / 1e8;
}
