// Logo de cada empresa (cliente dos pedidos): um quadradinho 16x16 em pixel art com um icone que
// tem a ver com o nome (App Vinil Roxo -> disco, Lanchonete Pixel -> hamburguer...). Ver a imagem
// de referencia reference_pedido.png. Cada desenho e 12x12, centralizado no quadrado.
import { PALETTE } from '../art/palette.js';

// Letra -> cor da paleta ('.' = transparente, mostra o fundo do logo)
export const LEGENDA = {
  k: 'ink', n: 'night', p: 'plum', g: 'grape', v: 'violet', o: 'orchid', l: 'lavender', i: 'lilac',
  m: 'mist', c: 'cream', b: 'blush', e: 'peach', y: 'butter', t: 'mint', s: 'sky', r: 'rose',
};

// Icones 12x12
export const ICONES = {
  disco: [
    '....kkkk....', '..kknnnnkk..', '.knnpnnnnnk.', '.knpnnnnnnk.', 'knnnrrrrnnnk', 'knnrrkkrrnnk',
    'knnrrkkrrnnk', 'knnnrrrrnnnk', '.knnnnnnpnk.', '.knnnnnpnnk.', '..kknnnnkk..', '....kkkk....',
  ],
  hamburguer: [
    '............', '...kkkkkk...', '.kkeeeeeekk.', 'keeceeeeceek', 'keeeeceeeeek', 'kkkkkkkkkkkk',
    'kttkttkttktk', 'kyyyyyyyyyyk', 'knnnnnnnnnnk', 'kkkkkkkkkkkk', 'keeeeeeeeeek', '.kkkkkkkkkk.',
  ],
  halter: [
    '............', '............', '.kkk....kkk.', '.kik....kik.', 'kkikkkkkkikk', 'kiiiiiiiiiik',
    'kkikkkkkkikk', '.kik....kik.', '.kkk....kkk.', '............', '............', '............',
  ],
  globo: [
    '....kkkk....', '..kksstskk..', '.ksstttsssk.', '.kstttsstsk.', 'ksstttssttsk', 'kssstssstttk',
    'ksssssstttsk', 'kstsssssttsk', '.ksttssstsk.', '.kstttssssk.', '..kksstskk..', '....kkkk....',
  ],
  moedaEstrela: [
    '....kkkk....', '..kkyyyykk..', '.kyyyyyyyek.', '.kyyyggyyek.', 'kyyyyggyyyek', 'kyggggggggek',
    'kyyggggggyek', 'kyyyggggyyek', '.kyggyyggyk.', '.kggyyyyggk.', '..kkeeeekk..', '....kkkk....',
  ],
  cofrinho: [
    '............', '.....kkk....', '.....kyk....', '..kkkkkkkk..', '.kbbbbbbbbk.', 'kbbbbbbbkbkk',
    'kbbbbbbbbbrk', 'kbbbbbbbbbrk', '.kbbbbbbbbk.', '..kbkkkkbk..', '..kk....kk..', '............',
  ],
  nuvemMoeda: [
    '............', '............', '....kkkk....', '...kcccck...', '.kkcccccckk.', 'kcccccccccck',
    'kccccccckkkk', '.kcccccckyyk', '..kkkkkkyyek', '.......kyeek', '........kkk.', '............',
  ],
  estrelaCadente: [
    '............', '.......k....', '......kyk...', '...kkkyyykkk', '....kyyyyyk.', '...o.kyyyk..',
    '..o.kyykyyk.', '.o.bkk...kk.', 'o.b.........', '.b..........', 'b...........', '............',
  ],
  luaCheia: [
    '....kkkk....', '..kkcccckk..', '.kcccccccmk.', '.kcciicccmk.', 'kccciicccmmk', 'kccccccccmmk',
    'kcccccciicmk', 'kcccccccccmk', '.kciiccccmk.', '.kccccccmmk.', '..kkmmmmkk..', '....kkkk....',
  ],
  luaCrescente: [
    '....kkkk....', '..kkyyyk....', '.kyyyyk.....', '.kyyyk......', 'kyyyk.......', 'kyyyk.......',
    'kyyyk.......', 'kyyyyk......', '.kyyyyk...k.', '.kyyyyykkyk.', '..kkyyyykk..', '....kkkk....',
  ],
  livro: [
    '............', '............', '.kkkk..kkkk.', 'kcccckkcccck', 'kcssckkcssck', 'kcccckkcccck',
    'kcssckkcssck', 'kcccckkcccck', 'kcccckkcccck', 'kssssssssssk', '.kkkkkkkkkk.', '............',
  ],
  ametista: [
    '............', '...kkkkkk...', '..kolloook..', '.kolloooovk.', 'kkkkkkkkkkkk', '.kvoolloovk.',
    '..kvoolovk..', '...kvoovk...', '....kvvk....', '.....kk.....', '............', '............',
  ],
  xicara: [
    '...v..v.....', '....v..v....', '...v..v.....', '............', '.kkkkkkkk...', '.knnnnnnk...',
    '.kcccccckkk.', '.kcccccck.k.', '.kcccccckkk.', '..kcccck....', 'kkkkkkkkkkk.', '.kkkkkkkkk..',
  ],
  claquete: [
    '............', 'kkkkkkkkkkkk', 'kcckkcckkcck', 'kkkkkkkkkkkk', 'kcckkcckkcck', 'kkkkkkkkkkkk',
    'kppppppppppk', 'kpccpppppppk', 'kppppppppppk', 'kpcccccppppk', 'kppppppppppk', 'kkkkkkkkkkkk',
  ],
  rolo: [
    '....kkkk....', '..kkrrrrkk..', '.krrrkkrrrk.', '.krrrkkrrrk.', 'krrrrrrrrrrk', 'krkkrbbrkkrk',
    'krkkrbbrkkrk', 'krrrrrrrrrrk', '.krrrkkrrrk.', '.krrrkkrrrk.', '..kkrrrrkk..', '....kkkk....',
  ],
  coracao: [
    '............', '..kk....kk..', '.krrk..krrk.', 'krbrrkkrrrrk', 'krbrrccrrrrk', 'krrrccccrrrk',
    '.krrrccrrrk.', '..krrrrrrk..', '...krrrrk...', '....krrk....', '.....kk.....', '............',
  ],
  nota: [
    '............', '....ggggggg.', '....ggggggg.', '....g.....g.', '....g.....g.', '....g.....g.',
    '....g.....g.', '..ggg...ggg.', '.gggg..gggg.', '.ggg...ggg..', '............', '............',
  ],
  capacete: [
    '............', '............', '.....kk.....', '...kkyykk...', '..kyyeeyyk..', '.kyyyeeyyyk.',
    '.kyyyeeyyek.', 'kkkkkkkkkkkk', 'keeeeeeeeeek', 'kkkkkkkkkkkk', '............', '............',
  ],
  lavanda: [
    '.....v......', '..v..ov..v..', '..ov.vo.ov..', '..vo.ov.vo..', '..ov.vo.ov..', '...p.op.p...',
    '...p..p.p...', '....p.pp....', '.....pp.....', '....rrrr....', '.....pp.....', '.....pp.....',
  ],
  caixa: [
    '............', '............', '...kkkkkkkkk', '...keeyyyeek', 'vv.keeyyyeek', '...kkkkkkkkk',
    '.vvkeeeeeeek', '...keeeeeeek', 'vv.keeeekkek', '...keeeeeeek', '...kkkkkkkkk', '............',
  ],
  arcoIris: [
    '............', '...kkkkkk...', '..krrrrrrk..', '.krryyyyrrk.', 'kryyssssyyrk', 'kryskkkksyrk',
    'krysk..ksyrk', 'krysk..ksyrk', 'kkkkk..kkkkk', '............', '............', '............',
  ],
  capelo: [
    '............', '............', '.....kk.....', '...kkppkk...', '.kkppppppkk.', 'kppppppppppk',
    '.kkppppppkky', '..kpkkkkpk.y', '..kppppppk.y', '..kppppppk..', '...kkkkkk...', '............',
  ],
  balao: [
    '............', '.kkkkkkkkkk.', 'kcccckkcccck', 'kccckcckccck', 'kccckkkkccck', 'kccckcckccck',
    'kcccccccccck', '.kkcckkkkkk.', '..kck.......', '..kk........', '............', '............',
  ],
  capsula: [
    '............', '............', '............', '.kkkkkkkkkk.', 'krrrrrkcccck', 'krbrrrkcccmk',
    'krrrrrkcmmmk', '.kkkkkkkkkk.', '............', '............', '............', '............',
  ],
  cama: [
    '............', '............', 'k...........', 'k..........k', 'kkkk.......k', 'kcckkkkkkkkk',
    'kcckoooooook', 'kkkkkkkkkkkk', 'kppppppppppk', 'kk........kk', '............', '............',
  ],
  carro: [
    '............', '............', '...kkkkkk...', '..ksskksssk.', '.kkkkkkkkkkk', 'kvvvvvvvvvvk',
    'kvyvvvvvvvrk', 'kvvvvvvvvvvk', 'kkkkkkkkkkkk', '.knnk..knnk.', '..kk....kk..', '............',
  ],
  sacola: [
    '............', '....kkkk....', '...k....k...', '...k....k...', '.kkkkkkkkkk.', '.kbbbbbbbbk.',
    '.kbbbbbbbbk.', '.kbbbccbbbk.', '.kbbbccbbbk.', '.kbbbbbbbbk.', '.kkkkkkkkkk.', '............',
  ],
  carrinho: [
    '............', 'kkk.........', '..kkkkkkkkkk', '..kooooooook', '...kooooook.', '...kooooook.',
    '....kkkkkkk.', '....k.......', '...kkkkkkkk.', '...kk....kk.', '...kk....kk.', '............',
  ],
  metro: [
    '..kkkkkkkk..', '.kvvvvvvvvk.', '.kvkkkkkkvk.', '.kvksssskvk.', '.kvksssskvk.', '.kvkkkkkkvk.',
    '.kvvvvvvvvk.', '.kvyvvvvyvk.', '.kvvvvvvvvk.', '..kkkkkkkk..', '..kk....kk..', '.kk......kk.',
  ],
  gato: [
    '............', '.kk......kk.', '.kok....kok.', '.kookkkkook.', '.kooooooook.', '.kokooookok.',
    'kkooobboookk', 'kkoookkoookk', '..kooooook..', '...kkkkkk...', '............', '............',
  ],
  engrenagem: [
    '....kkkk....', '.kk.kook.kk.', '.kokooookok.', '..kooooook..', 'kkookkkkookk', 'koook..koook',
    'koook..koook', 'kkookkkkookk', '..kooooook..', '.kokooookok.', '.kk.kook.kk.', '....kkkk....',
  ],
  pizza: [
    '............', '.kkkkkkkkkk.', '.keeeeeeeek.', '.kyyryyyyyk.', '..kyyyyryk..', '..kyryyyyk..',
    '...kyyryk...', '...kyyyyk...', '....kyyk....', '....kryk....', '.....kk.....', '............',
  ],
  prefeitura: [
    '.....kk.....', '...kkcckk...', '.kkcccccckk.', 'kkkkkkkkkkkk', '..cc.cc.cc..', '..cc.cc.cc..',
    '..cc.cc.cc..', '..cc.cc.cc..', '..cc.cc.cc..', 'kkkkkkkkkkkk', 'kcccccccccck', 'kkkkkkkkkkkk',
  ],
  ameixa: [
    '......k.kk..', '......kktk..', '...kkkkkkk..', '..kgvvgggk..', '.kgvvgggggk.', '.kgvggggggk.',
    '.kggggggggk.', '.kggggggppk.', '.kggggggppk.', '..kggggppk..', '...kkkkkk...', '............',
  ],
  radio: [
    '........k...', '.........k..', '..........k.', '.kkkkkkkkkk.', 'kvvvvvvvvvvk', 'kvnnnnvcccvk',
    'kvnnknvcccvk', 'kvnknnvvvvvk', 'kvnnnnvyvyvk', 'kvvvvvvvvvvk', '.kkkkkkkkkk.', '............',
  ],
  play: [
    '....kkkk....', '..kkrrrrkk..', '.krrcrrrrrk.', '.krrccrrrrk.', 'krrrcccrrrrk', 'krrrccccrrrk',
    'krrrccccrrrk', 'krrrcccrrrrk', '.krrccrrrrk.', '.krrcrrrrrk.', '..kkrrrrkk..', '....kkkk....',
  ],
  headset: [
    '............', '...kkkkkk...', '..k......k..', '.k........k.', '.k........k.', 'kkk......kkk',
    'kvvk....kvvk', 'kvvk....kvvk', 'kvvk....kvvk', 'kkkk....kkkk', '..k...kk....', '...kkkk.....',
  ],
  caminhao: [
    '............', '............', 'kkkkkkkk....', 'kooooookkkk.', 'kooooookssk.', 'kooooookssbk',
    'kooooookbbbk', 'kkkkkkkkkkkk', '.knnk..knnk.', '..kk....kk..', '............', '............',
  ],
  patinha: [
    '............', '...pp..pp...', '..ppp..ppp..', '...pp..pp...', 'pp........pp', 'ppp.pppp.ppp',
    '.p.pppppp.p.', '...pppppp...', '..pppppppp..', '..pppppppp..', '...pp..pp...', '............',
  ],
  bolhas: [
    '........kk..', '.......kcsk.', '.......kssk.', '........kk..', '..kkkk......', '.kcsssk.....',
    'kcsssssk....', 'kssssssk.kk.', '.kssssk.kcsk', '..kkkk..kssk', '.........kk.', '............',
  ],
  flor: [
    '....kkkk....', '..kkbbbbkk..', '.kbbkbbkbbk.', '.kbbbyybbbk.', '.kbbyyyybbk.', '.kbbbyybbbk.',
    '.kbbkbbkbbk.', '..kkbbbbkk..', '....kttk....', '.kkkkttk....', '.ktttkttk...', '..kkkkkk....',
  ],
  incenso: [
    '......v.....', '.....v......', '......v.....', '.......v....', '......r.....', '......p.....',
    '......p.....', '......p.....', '......p.....', '..kkkkkkkk..', '..keeeeeek..', '...kkkkkk...',
  ],
  sorvete: [
    '....kkkk....', '..kkbbbbkk..', '.kbbcbbbbbk.', '.kbcbbbbbbk.', '.kbbbbbbbbk.', '.kkkkkkkkkk.',
    '..keyeeyek..', '..keeyyeek..', '...keyyek...', '...kyeeyk...', '....keek....', '.....kk.....',
  ],
  lapis: [
    '............', '............', '............', 'kkkkkkkkk...', 'kbbioooooek.', 'kbbimmmmmeek',
    'kbbioooooeek', 'kbbioooooek.', 'kkkkkkkkk...', '............', '............', '............',
  ],
  telescopio: [
    '.y..........', '........kk..', '.......kssk.', '......ksssk.', '.....ksssk..', '....ksssk..y',
    '...kkssk....', '...kkkk.....', '....ll......', '...l..l.....', '..l....l....', 'y...........',
  ],
  aguaViva: [
    '............', '...kkkkkk...', '..kbbbbbbk..', '.kbbcbbbbbk.', '.kbbbbbbbbk.', '.kkkkkkkkkk.',
    '..o..o.o..o.', '...o.o..o.o.', '..o..o.o..o.', '...o.o..o.o.', '..o.....o...', '............',
  ],
  lotus: [
    '............', '.....kk.....', '....kbbk....', '.k.kbbbbk.k.', 'kbkkbbbbkkbk', 'kbbkbbbbkbbk',
    '.kbbkbbkbbk.', '..kbbbbbbk..', '.kkkkkkkkkk.', '.kttttttttk.', '..kkkkkkkk..', '............',
  ],
  pao: [
    '.........yy.', '..........y.', '............', '...kkkkkk...', '.kkeeeeeekk.', 'keceeceeceek',
    'keeeeeeeeeek', 'keeeeeeeeeek', '.kkkkkkkkkk.', '............', '............', '............',
  ],
  paleta: [
    '............', '..kkkkkkk...', '.kcccccccck.', 'kcrrcccccssk', 'kcrrcccccssk', 'kccccckkccck',
    'kcyycckkcttk', 'kcyycccccttk', '.kccccccccck', '..kkkcccckk.', '.....kkkk...', '............',
  ],
  aviao: [
    '.....kk.....', '....kcck....', '....kcck....', '..kkkcckkk..', 'kkcccccccckk', 'kcccccccccck',
    'kkkkkcckkkkk', '....kcck....', '....kcck....', '...kkcckk...', '..kcccccck..', '..kkkkkkkk..',
  ],
  laptop: [
    '............', '.kkkkkkkkkk.', '.kssssssssk.', '.ksccsssssk.', '.kssssssssk.', '.ksssssccsk.',
    '.kssssssssk.', '.kkkkkkkkkk.', 'kiiiiiiiiiik', 'kkkkkkkkkkkk', '............', '............',
  ],
  lampada: [
    '....kkkk....', '..kkyyyykk..', '.kyyccyyyyk.', '.kyycyyyyyk.', '.kyyyyyyyyk.', '..kyyyyyyk..',
    '...kyyyyk...', '...kkkkkk...', '...kiiiik...', '...kkkkkk...', '...kiiiik...', '....kkkk....',
  ],
  chaleira: [
    '...kkkkkk...', '..k......k..', '..k..kk..k..', '..kkkkkkkk..', '..kmmmmmmk..', 'k.kmmmmmmk..',
    'kkkrrrrrrk..', '.kkmmmmmmk..', '..kmmmmmmk..', '..kkkkkkkk..', '............', '............',
  ],
  joystick: [
    '....kkk.....', '...krrrk....', '...krbrk....', '...krrrk....', '....kkk.....', '.....k......',
    '.kkkkkkkkkk.', 'kvvvvvvvvvvk', 'kvvvvvvtvsvk', 'kvvvvvvvvvvk', '.kkkkkkkkkk.', '............',
  ],
  broto: [
    '............', '..kk....kk..', '.kttk..kttk.', '.ktttkktttk.', '..kttkkttk..', '...kkttkk...',
    '....kttk....', '.kkkkkkkkkk.', '.krrrrrrrrk.', '..krrrrrrk..', '..krrrrrrk..', '...kkkkkk...',
  ],
  solMar: [
    '............', '....kkkk....', '...kyyyyk...', '..kyyyyyyk..', '..kyyyyyyk..', '.kkkkkkkkkk.',
    '.ss..ss..ss.', 's..ss..ss..s', '............', '.ss..ss..ss.', 's..ss..ss..s', '............',
  ],
  bicicleta: [
    '............', '........kk..', '..kkk....k..', '....k...k...', '....kkkkk...', '...k.k..kk..',
    '.kkk.k..kkk.', 'k..kk..k...k', 'k.k.k..kk.kk', 'k...k..k...k', '.kkk....kkk.', '............',
  ],
  coelho: [
    '..k......k..', '.kck....kck.', '.kbk....kbk.', '.kck....kck.', '.kckkkkkkck.', 'kcccccccccck',
    'kcckcccckcck', 'kbccckkcccbk', '.kcccccccck.', '..kkkkkkkk..', '............', '............',
  ],
  envelope: [
    '............', '............', 'kkkkkkkkkkkk', 'kkcccccccckk', 'kckcccccckck', 'kcckcccckcck',
    'kccckrrkccck', 'kccccrrcccck', 'kcccccccccck', 'kkkkkkkkkkkk', '............', '............',
  ],
  bule: [
    '.....kk.....', '....kbbk....', '..kkkkkkkk..', 'kkkbbbbbbk.k', 'k.kbcbbbbkkk', 'k.kbbbbbbkk.',
    'kkkbbbbbbk..', '..kbbbbbbk..', '...kkkkkk...', '............', '............', '............',
  ],
  moldura: [
    '............', 'kkkkkkkkkkkk', 'kyyyyyyyyyyk', 'kykkkkkkkkyk', 'kykbbbbbbkyk', 'kykbbrrbbkyk',
    'kykbrrrrbkyk', 'kykvgvgvgkyk', 'kykgvgvgvkyk', 'kykkkkkkkkyk', 'kyyyyyyyyyyk', 'kkkkkkkkkkkk',
  ],
};

// Empresa -> [icone, cor de fundo]
export const LOGOS_CLIENTES = {
  'Academia Halter Lilás': ['halter', 'mint'],
  'App Vinil Roxo': ['disco', 'lavender'],
  'Atlas Geografia Roxa': ['globo', 'butter'],
  'Banco Estrela Roxa': ['moedaEstrela', 'grape'],
  'Banco Lilás': ['cofrinho', 'lilac'],
  'Banco Nuvem': ['nuvemMoeda', 'sky'],
  'Biblioteca Estrela Cadente': ['estrelaCadente', 'night'],
  'Biblioteca Lua Cheia': ['luaCheia', 'plum'],
  'Biblioteca Pixel Azul': ['livro', 'sky'],
  'Bistrô Ametista': ['ametista', 'mist'],
  'Café Lo-Fi': ['xicara', 'peach'],
  'Cine Pastel': ['claquete', 'blush'],
  'Cinemateca Neon': ['rolo', 'night'],
  'Clínica Bem-Estar': ['coracao', 'mint'],
  'Conservatório Sol Maior': ['nota', 'butter'],
  'Construtora Pedra Lilás': ['capacete', 'lilac'],
  'Cooperativa Lavanda': ['lavanda', 'butter'],
  'Entregas Cometa': ['caixa', 'sky'],
  'Escola Arco-Íris': ['arcoIris', 'mist'],
  'Escola Nebulosa': ['capelo', 'orchid'],
  'Escola de Idiomas Babel': ['balao', 'peach'],
  'Farmácia Lavanda': ['capsula', 'mint'],
  'Hotel Brisa Lilás': ['cama', 'sky'],
  'Lanchonete Pixel': ['hamburguer', 'plum'],
  'Locadora Veloz Roxa': ['carro', 'butter'],
  'Loja Neblina': ['sacola', 'lilac'],
  'Loja Pixel Lilás': ['carrinho', 'mint'],
  'Metrô Aurora': ['metro', 'blush'],
  'Petshop Bigode': ['gato', 'peach'],
  'Peças e Pixels': ['engrenagem', 'sky'],
  'Pizzaria Forno Roxo': ['pizza', 'grape'],
  'Prefeitura de Vila Lilás': ['prefeitura', 'sky'],
  'RH Ameixa Ltda.': ['ameixa', 'butter'],
  'Rede Caixa Lua': ['luaCrescente', 'grape'],
  'Rádio Vinil Roxo': ['radio', 'mint'],
  'Streaming Nébula': ['play', 'night'],
  'Suporte Nuvem Roxa': ['headset', 'lavender'],
  'Transportes Aurora': ['caminhao', 'mint'],
  'Floricultura Orvalho': ['flor', 'mint'],
  'Estúdio Yoga Incenso': ['incenso', 'lilac'],
  'Sorveteria Nuvem Doce': ['sorvete', 'sky'],
  'Papelaria Washi': ['lapis', 'butter'],
  'Observatório Céu Lilás': ['telescopio', 'night'],
  'Aquário Água-Viva': ['aguaViva', 'sky'],
  'Spa Lótus Rosa': ['lotus', 'lilac'],
  'Padaria Fermento Lunar': ['pao', 'plum'],
  'Ateliê Aquarela': ['paleta', 'lavender'],
  'Viagens Pôr do Sol': ['aviao', 'peach'],
  'Coworking Horizonte': ['laptop', 'mint'],
  'Luminária Vagalume': ['lampada', 'night'],
  'Chaleira Sereno': ['chaleira', 'lavender'],
  'Fliperama Algodão Doce': ['joystick', 'blush'],
  'Estufa Hortelã': ['broto', 'butter'],
  'Pousada Maré Mansa': ['solMar', 'blush'],
  'Bicicletas Vento Leve': ['bicicleta', 'butter'],
  'Bichinho Virtual Mochi': ['coelho', 'peach'],
  'Correio Pombo Rosa': ['envelope', 'sky'],
  'Casa de Chá Jasmim': ['bule', 'mint'],
  'Galeria Vapor': ['moldura', 'lilac'],
  // exemplos do guia
  'Lavanderia Bolha': ['bolhas', 'lilac'],
  'Clínica Vet Patinhas': ['patinha', 'blush'],
};

// Empresa fora da lista: tenta uma palavra do nome; senão um icone pelo hash do nome
const PALAVRAS = [
  [/pizz/i, 'pizza'], [/lanch|burg/i, 'hamburguer'], [/caf[eé]/i, 'xicara'], [/banco/i, 'moedaEstrela'],
  [/bibliot|livr/i, 'livro'], [/escola|faculd|univers/i, 'capelo'], [/cine/i, 'claquete'],
  [/cl[ií]nica|hospital|sa[uú]de/i, 'coracao'], [/farm[aá]c/i, 'capsula'], [/hotel|pousada/i, 'cama'],
  [/loja|mercado/i, 'sacola'], [/m[uú]sic|r[aá]dio/i, 'radio'], [/pet|vet/i, 'patinha'],
  [/entreg|transp|log[ií]st/i, 'caminhao'], [/academ/i, 'halter'], [/lavand/i, 'bolhas'],
];
const FUNDOS = ['lavender', 'mint', 'sky', 'blush', 'butter', 'peach', 'lilac', 'mist'];

function hash(texto) {
  let h = 2166136261;
  for (const ch of texto) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}

/** { icone, fundo } do logo da empresa (fundo em hex) */
export function logoDaEmpresa(nome = '') {
  const fixo = LOGOS_CLIENTES[nome];
  if (fixo) return { icone: fixo[0], fundo: PALETTE[fixo[1]] };
  const h = hash(nome);
  const nomes = Object.keys(ICONES);
  const icone = PALAVRAS.find(([re]) => re.test(nome))?.[1] ?? nomes[h % nomes.length];
  return { icone, fundo: PALETTE[FUNDOS[h % FUNDOS.length]] };
}

/** Caminhos SVG do icone, um por cor ({ cor, d }), ja deslocados para o centro do quadrado 16x16 */
export function camadasDoIcone(icone, dx = 2, dy = 2) {
  const porCor = {};
  ICONES[icone].forEach((linha, y) =>
    [...linha].forEach((ch, x) => {
      if (ch === '.') return;
      (porCor[ch] ??= []).push(`M${x + dx} ${y + dy}h1v1h-1z`);
    }),
  );
  return Object.entries(porCor).map(([ch, d]) => ({ cor: PALETTE[LEGENDA[ch]], d: d.join('') }));
}
