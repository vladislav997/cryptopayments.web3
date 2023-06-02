import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

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
      // ------------ trc ------------ //
      case 'class org.tron.core.exception.ContractValidateException : Validate TransferContract error, balance is not sufficient.':
        // trx: Insufficient coin balance
        message = 'Insufficient coin balance';
        break;
      case 'Account resource insufficient error.':
        // token: Insufficient coin balance
        message = 'Insufficient coin balance';
        break;
      case 'class org.tron.core.exception.ContractValidateException : Validate TransferContract error, no OwnerAccount.':
        message = 'Incorrect private key';
        break;
      // ------------ erc ------------ //
      case 'Returned error: INTERNAL_ERROR: insufficient funds':
        message = 'Insufficient coin balance';
        break;
      case 'Returned error: invalid opcode: INVALID':
        message = 'Insufficient token balance';
        break;
      // ------------ bsc ------------ //
      case 'Returned error: insufficient funds for gas * price + value':
        message = 'Insufficient coin balance';
        break;
      case 'Returned error: execution reverted: BEP20: transfer amount exceeds balance':
        message = 'Insufficient token balance';
        break;
      // ------------ general ------------ //
      case 'Private key must be 32 bytes in length.':
        message = 'Incorrect private key';
        break;
    }

    response.status(statusCode).json({
      status: false,
      message: message,
    });
  }
}
