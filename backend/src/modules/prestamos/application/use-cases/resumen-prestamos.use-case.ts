import { fechaEnColombia, sumarDias } from '../../domain/fecha-calendario';
import { PrestamoRepository } from '../../domain/repositories/prestamo.repository';
import { ResumenPrestamosOutput } from '../dtos/prestamo.dto';
import { diasAvisoValido } from './listar-prestamos.use-case';

/** HU-36: cuántos préstamos sin devolver hay, cuántos vencidos y cuántos próximos a vencer. */
export class ResumenPrestamosUseCase {
  constructor(
    private readonly prestamos: PrestamoRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(diasAviso?: number): Promise<ResumenPrestamosOutput> {
    const hoy = fechaEnColombia(this.reloj());
    const dias = diasAvisoValido(diasAviso);
    const conteo = await this.prestamos.contarPendientes(
      hoy,
      sumarDias(hoy, dias),
    );
    return { hoy, diasAviso: dias, ...conteo };
  }
}
