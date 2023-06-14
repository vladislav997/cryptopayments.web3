import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ERROR_MESSAGES } from '../constants/error-messages';

export const getStatusCode = <T>(exception: T): number => {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
};

export const getErrorMessage = <T>(exception: T): string => {
  return exception instanceof HttpException
    ? exception.message
    : String(exception);
};

@Catch()
export class GlobalExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // const request = ctx.getRequest<IncomingMessage>();
    const getStatus = getStatusCode<T>(exception);
    const getMessage = getErrorMessage<T>(exception);
    const statusCode =
      exception && exception['cause']?.status !== undefined
        ? exception['cause'].status
        : getStatus;
    let message =
      exception && exception['response'] && exception['response']['message']
        ? exception['response']['message']
        : exception && exception['options'] && exception['options']['cause']
        ? exception['options']['cause']
        : getMessage;

    switch (message) {
      // ------------ btc ------------ //
      case 'Non-base58 character':
        message = ERROR_MESSAGES.INCORRECT_PRIVATE_KEY;
        break;
      // ------------ trc ------------ //
      case 'class org.tron.core.exception.ContractValidateException : Validate TransferContract error, balance is not sufficient.':
        // trx: Insufficient coin balance
        message = ERROR_MESSAGES.INSUFFICIENT_COIN_BALANCE;
        break;
      case 'Account resource insufficient error.':
        // token: Insufficient coin balance
        message = ERROR_MESSAGES.INSUFFICIENT_COIN_BALANCE;
        break;
      case 'class org.tron.core.exception.ContractValidateException : Validate TransferContract error, no OwnerAccount.':
        message = ERROR_MESSAGES.INCORRECT_PRIVATE_KEY;
        break;
      // ------------ erc ------------ //
      case 'Returned error: INTERNAL_ERROR: insufficient funds':
        message = ERROR_MESSAGES.INSUFFICIENT_COIN_BALANCE;
        break;
      case 'Returned error: invalid opcode: INVALID':
        message = ERROR_MESSAGES.INSUFFICIENT_TOKEN_BALANCE;
        break;
      // ------------ bsc ------------ //
      case 'Returned error: insufficient funds for gas * price + value':
        message = ERROR_MESSAGES.INSUFFICIENT_COIN_BALANCE;
        break;
      case 'Returned error: execution reverted: BEP20: transfer amount exceeds balance':
        message = ERROR_MESSAGES.INSUFFICIENT_TOKEN_BALANCE;
        break;
      // ------------ general ------------ //
      case 'Private key must be 32 bytes in length.':
        message = ERROR_MESSAGES.INCORRECT_PRIVATE_KEY;
        break;
    }

    response.status(statusCode).json({
      status: false,
      message: message,
    });
  }
}
