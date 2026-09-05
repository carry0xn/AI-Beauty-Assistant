import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ChatMessageRequestDto } from '@aura/contracts';
import { firstValueFrom } from 'rxjs';

import { AuthedRequest } from './jwt-auth.guard';

interface FaceResult {
  face?: {
    shape?: string;
    shape_ratios?: Record<string, number>;
    symmetry_score?: number;
    skin_tone?: { tone?: string; undertone?: string; lab?: number[] };
    eye_color?: string;
    hair_color?: string;
    proportions?: Record<string, number>;
  };
  recommendations?: {
    face_shape?: string[];
    colorimetry?: string[];
    evidence?: string[];
  };
  knowledge_sources?: string[];
}

interface LatestAnalysisResponse {
  id: string;
  resultJson: FaceResult | null;
  createdAt: string;
}

const SHAPE_LABELS: Record<string, string> = {
  oval: 'oval',
  round: 'redonda',
  square: 'cuadrada',
  heart: 'corazón',
  oblong: 'alargada'
};

const TONE_LABELS: Record<string, string> = {
  light: 'claro',
  'medium-light': 'medio-claro',
  medium: 'medio',
  tan: 'moreno',
  deep: 'oscuro'
};

const UNDERTONE_LABELS: Record<string, string> = {
  warm: 'cálido',
  cool: 'frío',
  neutral: 'neutro'
};

const EYE_LABELS: Record<string, string> = {
  dark: 'oscuro',
  brown: 'marrones',
  blue: 'azules',
  green: 'verdes',
  hazel: 'avellana'
};

const HAIR_LABELS: Record<string, string> = {
  black: 'negro',
  blonde: 'rubio',
  gray: 'gris',
  red: 'pelirrojo',
  brown: 'castaño'
};

const SYMMETRY_LABELS: string[] = [
  'muy baja',
  'baja',
  'moderada',
  'buena',
  'muy buena'
];

const LOW_CONTRAST_PALETTE = 'tonos suaves y nudes (piel, rosa empolvado, humo, arena).';
const MEDIUM_CONTRAST_PALETTE = 'tonos medios (coral, lavanda, moka, teal apagado).';
const HIGH_CONTRAST_PALETTE = 'tonos profundos y joyas (rubí, esmeralda, zafiro, negro azulado).';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly bffUrl = process.env.BFF_URL ?? 'http://localhost:3001';

  constructor(private readonly httpService: HttpService) {}

  async sendMessage(dto: ChatMessageRequestDto, req: AuthedRequest) {
    const analysis = await this.fetchLatestAnalysis(req);

    if (!analysis) {
      return {
        reply:
          'Todavía no tengo datos sobre tu rostro. Subí una foto en la sección de análisis para que pueda darte recomendaciones personalizadas. 😊',
        received: dto
      };
    }

    const result = analysis.resultJson;
    const profile = this.buildProfile(result);
    const reply = this.answer(dto.message, result, profile);

    return { reply, received: dto, analysisId: analysis.id };
  }

  private async fetchLatestAnalysis(
    req: AuthedRequest
  ): Promise<LatestAnalysisResponse | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<LatestAnalysisResponse>(`${this.bffUrl}/analyses/latest-result`, {
          headers: { authorization: req.headers.authorization }
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('No se pudo obtener el análisis del usuario', error);
      throw new ServiceUnavailableException(
        'No pude consultar tu análisis en este momento. Intentalo de nuevo.'
      );
    }
  }

  private symmetryLabel(symmetry: number): string {
    const index = Math.min(4, Math.max(0, Math.floor(symmetry * 5)));
    return SYMMETRY_LABELS[index];
  }

  private symmetryPercent(symmetry: number): string {
    return `${Math.round(symmetry * 100)}%`;
  }

  private buildProfile(result: FaceResult | null): string {
    if (!result?.face) {
      return 'Tengo tu análisis guardado, pero sin detalles suficientes todavía.';
    }

    const { face } = result;
    const shape = SHAPE_LABELS[face.shape ?? ''] ?? 'indefinida';
    const tone = TONE_LABELS[face.skin_tone?.tone ?? ''] ?? face.skin_tone?.tone ?? 'desconocido';
    const undertone =
      UNDERTONE_LABELS[face.skin_tone?.undertone ?? ''] ?? face.skin_tone?.undertone ?? '';
    const eyes = EYE_LABELS[face.eye_color ?? ''] ?? face.eye_color ?? 'desconocido';
    const hair = HAIR_LABELS[face.hair_color ?? ''] ?? face.hair_color ?? 'desconocido';
    const symmetry = face.symmetry_score ?? null;

    const undertonePart = undertone ? ` con subtono ${undertone}` : '';
    let profile = `Tu rostro es ${shape}, tu piel es ${tone}${undertonePart}, tus ojos son de color ${eyes} y tu cabello es ${hair}.`;

    if (symmetry !== null) {
      profile += ` La simetría de tu rostro es ${this.symmetryLabel(symmetry)} (${this.symmetryPercent(symmetry)}).`;
    }

    const balance = this.describeProportions(face.proportions);
    if (balance) {
      profile += ` ${balance}`;
    }

    return profile;
  }

  private describeProportions(proportions?: Record<string, number>): string {
    if (!proportions) return '';

    const mouth = this.mouthWidthLabel(proportions.mouth_width_ratio);
    const lips = this.lipFullnessLabel(proportions.lip_height_ratio);
    const nose = this.noseWidthLabel(proportions.nose_width_ratio);
    const eyes = this.eyeSpacingLabel(proportions.interpupillary_ratio);

    const parts = [mouth, lips, nose, eyes].filter((part) => part !== null) as string[];
    if (!parts.length) return '';

    return `Sobre tus proporciones: ${parts.join(' ')}`;
  }

  private mouthWidthLabel(ratio?: number): string | null {
    if (ratio === undefined) return null;
    if (ratio > 0.55) return `tenés una boca ancha en comparación con tus pómulos (${ratio.toFixed(2)}).`;
    if (ratio < 0.42) return `tu boca es más fina que el ancho de tus pómulos (${ratio.toFixed(2)}).`;
    return `tu boca tiene una proporción equilibrada con tus pómulos (${ratio.toFixed(2)}).`;
  }

  private lipFullnessLabel(ratio?: number): string | null {
    if (ratio === undefined) return null;
    if (ratio >= 0.1) return `tus labios son carnosos (${ratio.toFixed(2)}).`;
    if (ratio <= 0.075) return `tus labios son finos (${ratio.toFixed(2)}).`;
    return `tus labios tienen un volumen medio (${ratio.toFixed(2)}).`;
  }

  private noseWidthLabel(ratio?: number): string | null {
    if (ratio === undefined) return null;
    if (ratio > 0.34) return `tu nariz es proporcionalmente ancha (${ratio.toFixed(2)}).`;
    if (ratio < 0.27) return `tu nariz es proporcionadamente fina (${ratio.toFixed(2)}).`;
    return `tu nariz está bien proporcionada (${ratio.toFixed(2)}).`;
  }

  private eyeSpacingLabel(ratio?: number): string | null {
    if (ratio === undefined) return null;
    if (ratio > 0.53) return `tus ojos están algo separados (${ratio.toFixed(2)}).`;
    if (ratio < 0.47) return `tus ojos están algo juntos (${ratio.toFixed(2)}).`;
    return `tus ojos están bien espaciados (${ratio.toFixed(2)}).`;
  }

  private answer(message: string, result: FaceResult | null, profile: string): string {
    const text = this.normalize(message);
    const intents = this.detectIntents(text);

    if (intents.saludo && !intents.tematica.length) {
      return `¡Hola! 😊 ${profile}\n\nPuedo contarte sobre: forma de rostro, piel y maquillaje, tus ojos, labios, nariz, proporciones, simetría, colores que te favorecen, tu rutina y productos. ¿Qué querés explorar?`;
    }

    if (intents.agradecer) {
      return '¡De nada! Cualquier cosa que quieras saber sobre tu belleza, acá estoy. 💜';
    }

    if (intents.tematica.includes('simetria') && result?.face?.symmetry_score !== undefined) {
      return this.simetriaReply(result);
    }

    if (intents.tematica.includes('proporciones')) {
      return this.proporcionesReply(result);
    }

    if (intents.tematica.includes('colores')) {
      return this.coloresReply(result);
    }

    if (intents.tematica.includes('piel') && result?.face?.skin_tone) {
      return this.pielReply(result, profile);
    }

    if (intents.tematica.includes('rostro') && result?.face?.shape) {
      return this.rostroReply(result, profile);
    }

    if (intents.tematica.includes('ojos') && result?.face?.eye_color) {
      return this.ojosReply(result);
    }

    if (intents.tematica.includes('labios')) {
      return this.labiosReply(result);
    }

    if (intents.tematica.includes('nariz')) {
      return this.narizReply(result);
    }

    if (intents.tematica.includes('cabello') && result?.face?.hair_color) {
      return this.cabelloReply(result, profile);
    }

    if (intents.tematica.includes('productos')) {
      return this.productosReply(result);
    }

    if (intents.tematica.includes('rutina') && result?.recommendations) {
      return this.rutinaReply(result);
    }

    if (intents.tematica.includes('cuerpo')) {
      return 'El análisis corporal todavía no está disponible en el sistema (ya está planificado). Por ahora puedo ayudarte con todo lo relacionado a tu rostro: forma, piel, ojos, labios, nariz, proporciones y colores. ¿Qué te interesa?';
    }

    if (intents.tematica.includes('edad')) {
      return 'Todavía no estimo la edad en el análisis: me enfoco en forma de rostro, proporciones, color y simetría. Si te interesa alguno de esos, preguntame y te cuento con detalle.';
    }

    return `${profile}\n\nPuedo hablarte sobre: piel y maquillaje, forma de tu rostro, ojos, labios, nariz, proporciones, simetría, colores que te favorecen, rutina, productos y cabello. ¿Qué querés saber?`;
  }

  private simetriaReply(result: FaceResult | null): string {
    const symmetry = result?.face?.symmetry_score ?? 0;
    const label = this.symmetryLabel(symmetry);
    const percent = this.symmetryPercent(symmetry);

    let tactica =
      symmetry >= 0.85
        ? 'Podés jugar con looks simétricos y detallados sin problema: delineados definidos y peinados parejos te van a sentar muy bien.'
        : symmetry >= 0.7
          ? 'Tenés buena base para casi cualquier look; los peinados con raya al costado suman interés sin alterar el balance.'
          : symmetry >= 0.55
            ? 'Un contouring suave y peinados asimétricos ayudan a equilibrar visualmente sin perder naturalidad.'
            : 'La asimetría es parte de la belleza natural. Usá técnicas suaves de sombreado y evitá simetrías muy marcadas para suavizar.';

    return `Tu nivel de simetría facial es ${percent} ${label}.\n\n${tactica}`;
  }

  private proporcionesReply(result: FaceResult | null): string {
    const proportions = result?.face?.proportions;
    if (!proportions || !Object.keys(proportions).length) {
      return 'Todavía no tengo medidas de proporciones de tu análisis. Subí una foto de frente bien iluminada para que se calculen.';
    }

    const rows: string[] = [];
    const mouth = this.mouthWidthLabel(proportions.mouth_width_ratio);
    const lips = this.lipFullnessLabel(proportions.lip_height_ratio);
    const nose = this.noseWidthLabel(proportions.nose_width_ratio);
    const eyes = this.eyeSpacingLabel(proportions.interpupillary_ratio);

    if (mouth) rows.push(mouth);
    if (lips) rows.push(lips);
    if (nose) rows.push(nose);
    if (eyes) rows.push(eyes);

    const raw = Object.entries(proportions)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `Estas son tus proporciones faciales detectadas:\n\n${rows
      .map((row) => `• ${row}`)
      .join('\n')}\n\nDetalle técnico:\n${raw}`;
  }

  private coloresReply(result: FaceResult | null): string {
    const undertone = result?.face?.skin_tone?.undertone ?? 'neutral';
    const tone = result?.face?.skin_tone?.tone ?? 'medium';
    const hair = result?.face?.hair_color ?? 'brown';
    const eyes = result?.face?.eye_color ?? 'brown';

    let contrast = 'medio';
    if (['light', 'medium-light'].includes(tone) && (hair === 'blonde' || hair === 'gray')) {
      contrast = 'bajo';
    } else if (tone === 'deep' || (tone === 'tan' && hair === 'black')) {
      contrast = 'alto';
    }

    const palette = this.paletteByUndertone(undertone);
    const contrastPalette =
      contrast === 'alto'
        ? HIGH_CONTRAST_PALETTE
        : contrast === 'bajo'
          ? LOW_CONTRAST_PALETTE
          : MEDIUM_CONTRAST_PALETTE;

    return `Según tu subtono ${UNDERTONE_LABELS[undertone] ?? undertone} y el contraste de tu piel (${tone}) con tu cabello (${hair}) y ojos (${eyes}), los colores que más te van a favorecer son:\n\n${palette
      .map((color) => `• ${color}`)
      .join('\n')}\n\nComo tu contraste es ${contrast}, priorizá ${contrastPalette}\n\nOjos ${eyes} y cabello ${hair} suman juego: si querés resaltar tu mirada, te doy ideas puntuales para tus ojos.`;
  }

  private paletteByUndertone(undertone: string): string[] {
    if (undertone === 'warm') {
      return ['Tierra y terracota', 'Dorados y bronce', 'Verde oliva', 'Coral', 'Miel'];
    }
    if (undertone === 'cool') {
      return ['Ciruela y rosa frío', 'Plata y gris perla', 'Azul profundo', 'Burdeos', 'Lila'];
    }
    return [
      'Tonos neutros cálidos y fríos por igual',
      'Camel y greige',
      'Rosa empolvado',
      'Verde salvia',
      'Azul medio'
    ];
  }

  private pielReply(result: FaceResult | null, profile: string): string {
    const tone = TONE_LABELS[result?.face?.skin_tone?.tone ?? ''] ?? 'de tu tono';
    const undertone =
      UNDERTONE_LABELS[result?.face?.skin_tone?.undertone ?? ''] ?? 'neutro';
    const tips = result?.recommendations?.colorimetry ?? [];

    const tipsPart = tips.length
      ? `\n\nAlgunas sugerencias para vos:\n${tips.map((tip) => `• ${tip}`).join('\n')}`
      : '';

    const baseTip =
      undertone === 'warm'
        ? 'Buscá bases con subtono amarillo/dorado.'
        : undertone === 'cool'
          ? 'Buscá bases con subtono rosado o neutro-frío.'
          : 'Podés usar bases cálidas o frías según la estación.';

    return `Tu piel es ${tone} con subtono ${undertone}. ${profile}\n\n${baseTip}${tipsPart}`;
  }

  private rostroReply(result: FaceResult | null, profile: string): string {
    const shape = SHAPE_LABELS[result?.face?.shape ?? ''] ?? 'indefinida';
    const tips = result?.recommendations?.face_shape ?? [];

    const tipsPart = tips.length
      ? `\n\nConsejos para tu rostro ${shape}:\n${tips.map((tip) => `• ${tip}`).join('\n')}`
      : '';

    return `${profile}${tipsPart}`;
  }

  private ojosReply(result: FaceResult | null): string {
    const face = result?.face;
    const eyeLabel = EYE_LABELS[face?.eye_color ?? ''] ?? 'oscuro';
    const eyeTips: Record<string, string> = {
      blue: 'los tonos bronce, cobre y durazno realzan el azul',
      green: 'los morados, ciruela y vino contrastan con el verde',
      brown: 'casi todo: bronces, lilas, azules y verdes funcionan',
      hazel: 'los dorados y verdes oliva sacan los reflejos avellana',
      dark: 'los grises, plateados y azules profundos resaltan el brillo'
    };
    const eyeTip = eyeTips[face?.eye_color ?? ''] ?? 'casi todos los tonos';

    const spacing = this.eyeSpacingLabel(face?.proportions?.interpupillary_ratio);
    const spacingPart = spacing ? `\n\n${spacing}` : '';

    return `Tus ojos son de color ${eyeLabel}. Para resaltarlos, ${eyeTip}.\n\nSi querés un delineado, los grises y marrones ahumados son los más versátiles.${spacingPart}`;
  }

  private labiosReply(result: FaceResult | null): string {
    const face = result?.face;
    const fullness = this.lipFullnessLabel(face?.proportions?.lip_height_ratio) ?? '';
    const width = this.mouthWidthLabel(face?.proportions?.mouth_width_ratio) ?? '';
    const undertone = UNDERTONE_LABELS[face?.skin_tone?.undertone ?? ''] ?? 'neutro';

    const lipTip = fullness.includes('carnosos')
      ? 'Podés llevar labiales mates con seguridad; los tonos intensos se van a destacar.'
      : fullness.includes('finos')
        ? 'Priorizá glosses y labiales brillantes, y evitá los mates muy oscuros que achican visualmente.'
        : 'Tenés versatilidad: tanto mates como brillos armonizan con tu perfil.';

    const colorTip =
      undertone === 'warm'
        ? 'Te favorecen los rojos con base cálida (rojo ladrillo, terracota, coral).'
        : undertone === 'cool'
          ? 'Te favorecen los rojos con base fría (rojo frambuesa, ciruela, burdeos).'
          : 'Podés jugar con rojos cálidos y fríos por igual.';

    return `Sobre tus labios: ${fullness} ${width}\n\n${lipTip}\n\n${colorTip}`;
  }

  private narizReply(result: FaceResult | null): string {
    const nose = this.noseWidthLabel(result?.face?.proportions?.nose_width_ratio);
    const shape = result?.face?.shape ?? '';

    const contourTip = nose?.includes('ancha')
      ? 'Un contouring suave a los costados del puente y un iluminador central delgado estilizan visualmente.'
      : nose?.includes('fina')
        ? 'Evitá shadowing excesivo en el puente; vas a sumar definición con iluminador en el centro.'
        : 'Un contouring sutil en los laterales y un toque de iluminador en el centro te van a quedar muy naturales.';

    return `${nose ?? 'No tengo la medición de tu nariz en el análisis todavía.'}\n\n${contourTip}${
      shape ? `\n\nRecordá: en un rostro ${SHAPE_LABELS[shape] ?? shape}, menos producto suele favorecer más.` : ''
    }`;
  }

  private cabelloReply(result: FaceResult | null, profile: string): string {
    const face = result?.face;
    const hair = HAIR_LABELS[face?.hair_color ?? ''] ?? 'castaño';
    const undertone = UNDERTONE_LABELS[face?.skin_tone?.undertone ?? ''] ?? 'neutro';

    const tintTip =
      undertone === 'warm'
        ? 'Los tintes con reflejos cálidos (miel, caramelo, cobrizo) armonizan con tu subtono.'
        : undertone === 'cool'
          ? 'Los tintes con reflejos fríos (ceniza, platinado, chocolate frío) armonizan con tu subtono.'
          : 'Podés alternar reflejos cálidos y fríos según la estación.';

    return `Tu cabello es ${hair}. ${profile}\n\n${tintTip}\n\nTambién influye tu contraste general: con tu piel y tono de ojos, los reflejos sutiles suman luz sin cambiar radicalmente tu armonía.`;
  }

  private productosReply(result: FaceResult | null): string {
    const tips = result?.recommendations?.colorimetry ?? [];

    return `Por ahora te sugiero enfocarte en:\n\n${[
      ...(result?.recommendations?.face_shape ?? []),
      ...tips
    ]
      .slice(0, 4)
      .map((tip) => `• ${tip}`)
      .join('\n')}\n\nLa integración con el catálogo de productos ya está planificada: pronto vas a poder ver marcas y productos puntuales para tu perfil. Mientras tanto, estos consejos te orientan en texturas y colores.`;
  }

  private rutinaReply(result: FaceResult | null): string {
    const evidencia = result?.recommendations?.evidence ?? [];
    const sources = result?.knowledge_sources ?? [];

    const evidencePart = evidencia.length
      ? `Esto es lo que encontré en la base de conocimiento para tu caso:\n\n${evidencia
          .slice(0, 3)
          .map((e) => `• ${e}`)
          .join('\n')}`
      : 'Todavía no tengo recomendaciones detalladas para tu caso, pero puedo ayudarte con consejos generales.';

    const sourcesPart = sources.length
      ? `\n\nFuentes consultadas: ${sources.join(', ')}.`
      : '';

    return `${evidencePart}${sourcesPart}`;
  }

  private normalize(message: string): string {
    return message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private detectIntents(text: string): { saludo: boolean; agradecer: boolean; tematica: string[] } {
    const intents: { saludo: boolean; agradecer: boolean; tematica: string[] } = {
      saludo: false,
      agradecer: false,
      tematica: []
    };

    if (/\b(hola|buenas|buen dia|buenos dias|hey|que tal)\b/.test(text)) {
      intents.saludo = true;
    }

    if (/\b(gracias|muchas gracias|genial|perfecto|excelente)\b/.test(text)) {
      intents.agradecer = true;
    }

    if (/(piel|tono de piel|base|maquillaje|subtono|colorimetria|rubor|iluminador)/.test(text)) {
      intents.tematica.push('piel');
    }
    if (/(simetr|balance|armon|proporcionad|equilibrio)/.test(text)) {
      intents.tematica.push('simetria');
    }
    if (/(proporciones|medidas|ratio|medicion|mediciones)/.test(text)) {
      intents.tematica.push('proporciones');
    }
    if (/(colores|paleta|favorece|favorecen|que color|tonos? que|cromatic|estaciones)/.test(text)) {
      intents.tematica.push('colores');
    }
    if (/(rostro|cara|forma|peinado|corte|contour|mandibula|pomulos)/.test(text)) {
      intents.tematica.push('rostro');
    }
    if (/(ojo|ojos|sombras|delin|mirada)/.test(text)) {
      intents.tematica.push('ojos');
    }
    if (/(labios|boca|labial)/.test(text)) {
      intents.tematica.push('labios');
    }
    if (/(nariz)/.test(text)) {
      intents.tematica.push('nariz');
    }
    if (/(cabello|pelo|tinte|color de pelo|flequillo|rulo|rizos)/.test(text)) {
      intents.tematica.push('cabello');
    }
    if (/(productos?|comprar|marca|kit)/.test(text)) {
      intents.tematica.push('productos');
    }
    if (/(cuerpo|silueta|figura|body|cuerpazo)/.test(text)) {
      intents.tematica.push('cuerpo');
    }
    if (/(edad|anios|años|joven|arruga)/.test(text)) {
      intents.tematica.push('edad');
    }
    if (/(rutina|recomendacion|consejo|evidencia|ayuda)/.test(text)) {
      intents.tematica.push('rutina');
    }

    return intents;
  }
}