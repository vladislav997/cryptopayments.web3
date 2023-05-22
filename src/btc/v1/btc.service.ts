import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as CryptoJS from 'crypto-js';
import * as bs58 from 'bs58';
import { Buffer } from 'buffer';
import { Observable, of, switchMap } from 'rxjs';
import { AxiosResponse } from 'axios';
import { validate } from 'bitcoin-address-validation';

@Injectable()
export class BtcServiceV1 {
  constructor(private readonly httpService: HttpService) {}

  generateKeyPair() {
    const privateKey = CryptoJS.lib.WordArray.random(32).toString();
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    return { publicKey, privateKey };
  }

  generateBitcoinAddress(publicKey: string) {
    const publicKeyBytes = CryptoJS.enc.Hex.parse(publicKey);
    const publicKeyHash = CryptoJS.RIPEMD160(publicKeyBytes).toString();
    const networkPrefix = '00'; // Bitcoin mainnet address prefix
    const extendedPublicKey = networkPrefix + publicKeyHash;
    const extendedPublicKeyBytes = CryptoJS.enc.Hex.parse(extendedPublicKey);
    const checksum = CryptoJS.SHA256(CryptoJS.SHA256(extendedPublicKeyBytes))
      .toString()
      .slice(0, 8);
    const addressBytes = CryptoJS.enc.Hex.parse(extendedPublicKey + checksum);
    const encodedAddress = bs58.encode(
      Buffer.from(addressBytes.toString(), 'hex'),
    );
    return encodedAddress;
  }

  async create() {
    try {
      const { publicKey, privateKey } = this.generateKeyPair();

      return {
        status: true,
        data: {
          address: this.generateBitcoinAddress(publicKey),
          privateKey: privateKey,
          publicKey: publicKey,
        },
      };
    } catch (e) {
      throw new HttpException(
        {
          message: e.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async balance(balanceBrcDto): Promise<Observable<any>> {
    try {
      const address = balanceBrcDto.address;

      if (!validate(address)) {
        return of({
          status: false,
          message: 'Incorrect address',
        });
      }

      const url = `https://blockstream.info/api/address/${address}/utxo`;

      return this.httpService.get<any[]>(url).pipe(
        switchMap((response: AxiosResponse<any[]>) => {
          const totalBalance = response.data.reduce(
            (total, utxo) => total + utxo.value,
            0,
          );
          return of({
            status: true,
            data: totalBalance / 1e8,
          });
        }),
      );
    } catch (e) {
      throw new HttpException(
        {
          message: e.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
