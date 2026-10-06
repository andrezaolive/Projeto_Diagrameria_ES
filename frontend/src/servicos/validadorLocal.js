import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import schemaDiagrama from '../../../backend/docs/schemas/diagrama.schema.json';

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);

const validarEsquema = ajv.compile(schemaDiagrama);

export function validarDiagramaLocal(diagrama) {
  const valido = validarEsquema(diagrama);
  if (!valido) {
    return validarEsquema.errors.map((e) => ({
      campo: e.instancePath || '(corpo)',
      mensagem: e.message,
    }));
  }
  return [];
}