import { ApiProperty } from '@nestjs/swagger';

export class SwaggerMetaResponse {
  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 'Inquiry berhasil' })
  status_description: string;
}

export class Meta {
  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 1000 })
  total: number;

  @ApiProperty({ example: 100 })
  totalPage: number;
}
