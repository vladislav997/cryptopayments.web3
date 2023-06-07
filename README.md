# CryptoPayments WEB3

## Installation

```bash
$ cp .env.development .env
```

```bash
$ npm install
```

## Documentation
See docs/ directory

## Set up

### Used API:

For ETH history transactions (☝️needed to add [key](https://etherscan.io/apis) to .env)
```html
https://etherscan.io
```

For BSC history transactions (☝️needed to add [key](https://bscscan.com/apis) to .env)
```html
https://bscscan.com
```

For TRC full api (☝️needed to add [key](https://www.trongrid.io) to .env)
```html
https://trongrid.io
```

For BTC check commission (fee)
```html
https://bitcoinfees.earn.com
```

For BTC:
send transaction /
get previous transaction hash /
check balance
(❗it's a paid api)
```html
https://blockchair.com
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### TO DO:
- [ ] Fix sending BTC transaction
- [ ] Viewing the transaction info for tokens in Tron
- [ ] Viewing the transaction info for Web3

## Author
- [Vladyslav Klopota](https://www.linkedin.com/in/vladyslav-k-b1225423a/)