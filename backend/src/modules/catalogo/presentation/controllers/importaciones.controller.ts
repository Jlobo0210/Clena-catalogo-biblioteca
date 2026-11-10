import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Autenticado } from '../../../auth/presentation/decorators/autenticado.decorator';
import { Rol } from '../../../auth/domain/value-objects/rol';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import {
  COLUMNAS_CATALOGO,
  ImportarCatalogoUseCase,
  MAX_FILAS,
  SEPARADOR_LISTA,
  plantillaCsv,
} from '../../application/use-cases/importar-catalogo.use-case';
import { ReporteImportacionResponse } from '../dtos/importacion-response.dto';

export const TAMANO_MAXIMO_ARCHIVO = 2 * 1024 * 1024; // 2 MB

/** HU-19: importación del catálogo desde CSV. Solo para el personal y el administrador. */
@ApiTags('importaciones')
@Controller('importaciones')
@Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)
export class ImportacionesController {
  constructor(private readonly importar: ImportarCatalogoUseCase) {}

  @Get('plantilla')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="plantilla-catalogo.csv"',
  )
  @ApiOperation({
    summary: 'Descargar la plantilla CSV del catálogo',
    description: `Columnas: ${COLUMNAS_CATALOGO.join(', ')}. Obligatorias: titulo, autores e idioma. Varios autores o temas se separan con «${SEPARADOR_LISTA}».`,
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'Archivo plantilla-catalogo.csv' })
  plantilla(): string {
    // El BOM hace que Excel abra el archivo en UTF-8 y muestre bien las tildes.
    return '\uFEFF' + plantillaCsv();
  }

  @Post('libros')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: TAMANO_MAXIMO_ARCHIVO } }),
  )
  @ApiOperation({
    summary: 'Importar libros y ejemplares desde un CSV',
    description: `Cada fila se valida y se guarda por separado: las válidas se importan y las demás se informan con su número de línea. Máximo ${MAX_FILAS} filas y 2 MB. Separador: coma o punto y coma. Codificación: UTF-8 o la de Excel (Windows-1252).`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo'],
      properties: { archivo: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: ReporteImportacionResponse })
  @ApiBadRequestResponse({
    description:
      'Archivo ausente, que no es CSV, mal formado o sin las columnas obligatorias',
    type: ErrorResponse,
  })
  importarLibros(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: TAMANO_MAXIMO_ARCHIVO }),
        ],
      }),
    )
    archivo: Express.Multer.File,
  ) {
    if (!/\.csv$/i.test(archivo.originalname)) {
      throw new BadRequestException('El archivo debe tener extensión .csv');
    }
    return this.importar.execute(decodificar(archivo.buffer));
  }
}

/** UTF-8 si es válido; si no, Windows-1252, que es como guarda Excel «CSV (delimitado por comas)». */
function decodificar(buffer: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}
