import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

import { MessageDto } from './message.dto';

@Injectable()
export class ParseMessagePipe implements PipeTransform<any, MessageDto> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(rawMessage: any, metadata: ArgumentMetadata): MessageDto {
    const parsedMessage = new MessageDto(rawMessage);

    return parsedMessage;
  }
}
