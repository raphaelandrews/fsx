import { RatingRule } from "./components/rating-rule";
import { TitulacaoGuidelines } from "./components/titulacao-guidelines";

export const titulations = [
  {
    title: "GMS",
    description: "Requisitos para obtenção do título de Grande Mestre Sergipano.",
    content: (
      <TitulacaoGuidelines
        intro={
          <p>
            Obterá o título de GRANDE MESTRE SERGIPANO o enxadrista que:
          </p>
        }
        requirements={
          <>
            <p>1. Atingir 2400 de rating FSX em qualquer ritmo.</p>
            <div>
              <p>
                2. Figurar entre os 3 primeiros colocados, ao menos quatro
                vezes, na categoria Absoluto de algum dos seguintes
                campeonatos:
              </p>
              <div className="ml-6 mt-2 space-y-1 text-muted-foreground">
                <p>• Campeonato Sergipano Blitz</p>
                <p>• Campeonato Sergipano Rápido</p>
                <p>• Campeonato Sergipano Absoluto</p>
                <p>• Campeonato Sergipano de Equipes</p>
                <p>
                  • Campeonatos aprovados pela diretoria da FSX para compor
                  norma
                </p>
              </div>
            </div>
            <p>
              3. Conquistar por duas vezes o Campeonato Sergipano Absoluto
              ou conquistar três títulos nos campeonatos listados acima.
            </p>
          </>
        }
        note={
          <p>
            Para a obtenção da titulação, é obrigatório cumprir o item 1,
            além do item 2 ou 3.
          </p>
        }
      />
    )
  },
  {
    title: "MSE",
    description: "Requisitos para obtenção do título de Mestre Sergipano.",
    content: (
      <TitulacaoGuidelines
        intro={
          <p>Obterá o título de MESTRE SERGIPANO, o enxadrista que:</p>
        }
        requirements={
          <>
            <p>1. Atingir 2300 de rating FSX em qualquer ritmo.</p>
            <p>
              2. Figurar entre os 3 primeiros colocados, ao menos duas vezes
              nos campeonatos listados no item 2 da titulação de GMS.
            </p>
            <p>
              3. Conquistar o Campeonato Sergipano Absoluto ou conquistar
              dois títulos nos campeonatos listados no item 2 da titulação de GMS.
            </p>
          </>
        }
        note={
          <p>
            Para a obtenção da titulação, é obrigatório cumprir o item 1,
            além do item 2 ou 3.
          </p>
        }
      />
    )
  },
  {
    title: "CMS",
    description: "Requisitos para obtenção do título de Candidato a Mestre Sergipano.",
    content: (
      <TitulacaoGuidelines
        intro={
          <p>
            Obterá o título de CANDIDATO A MESTRE SERGIPANO o enxadrista
            que:
          </p>
        }
        requirements={
          <>
            <p>1. Atingir 2200 de rating FSX em qualquer ritmo.</p>
            <p>
              2. Figurar entre os 5 primeiros colocados, ao menos uma vez,
              na categoria Absoluto dos campeonatos listados no item 2 da titulação de GMS.
            </p>
          </>
        }
        note={
          <p>
            É necessário cumprir ambos os itens 1 e 2 para a obtenção da
            titulação.
          </p>
        }
      />
    )
  },
  {
    title: "MJS",
    description: "Requisitos para obtenção do título de Mestre Júnior Sergipano.",
    content: (
      <TitulacaoGuidelines
        intro={
          <p>
            Obterá o título de MESTRE JÚNIOR SERGIPANO o enxadrista que:
          </p>
        }
        requirements={
          <>
            <p>1. Atingir 2100 de rating FSX em qualquer ritmo.</p>
            <p>2. Tiver 18 anos ou menos.</p>
          </>
        }
        note={
          <>
            <p>
              É necessário cumprir ambos os itens 1 e 2 para a obtenção da
              titulação.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              No ano em que o enxadrista completa 19 anos, perderá a
              referida titulação.
            </p>
          </>
        }
      />
    )
  },
  {
    title: "MMS",
    description: "Requisitos para Mestre Mirim Sergipano.",
    content: (
      <TitulacaoGuidelines
        intro={
          <p>Obterá o título de MESTRE MIRIM SERGIPANO o enxadrista que:</p>
        }
        requirements={
          <>
            <p>1. Atingir 2000 de rating FSX em qualquer ritmo.</p>
            <p>2. Tiver 14 anos ou menos.</p>
          </>
        }
        note={
          <>
            <p>
              É necessário cumprir ambos os itens 1 e 2 para a obtenção da
              titulação.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              No ano em que o enxadrista completa 15 anos, perderá a
              referida titulação.
            </p>
          </>
        }
      />
    )
  },
  {
    title: "MFS",
    description: "Requisitos para Mestre Feminina Sergipana.",
    content: (
      <TitulacaoGuidelines
        intro={
          <p>
            Obterá o título de MESTRE FEMININA SERGIPANA a enxadrista que:
          </p>
        }
        requirements={
          <>
            <p>1. Atingir 2150 de rating FSX em qualquer ritmo.</p>
            <p>2. Ser pessoa do gênero feminino.</p>
          </>
        }
        note={
          <p>
            É necessário cumprir ambos os itens 1 e 2 para a obtenção da
            titulação.
          </p>
        }
      />
    )
  },
  {
    title: "MSHC",
    description: "Título honorário para contribuição ao xadrez sergipano.",
    content: (
      <TitulacaoGuidelines
        intro={
          <p>
            Obterá o título de MESTRE SERGIPANO HONORIS CAUSA o enxadrista
            que:
          </p>
        }
        requirements={
          <p>
            Contribuiu ativamente para a promoção do xadrez no estado de
            Sergipe.
          </p>
        }
        note={
          <p>
            A avaliação para conceder a referida titulação ficará a
            critério dos membros que compõem a diretoria da Federação
            Sergipana de Xadrez.
          </p>
        }
      />
    )
  }
];

export const ratingVariations = [
  {
    title: "Variação de Rating",
    description: "Regras sobre o fator K e variação de rating.",
    content: (
      <div className="flex flex-col">
        <RatingRule
          k={1}
          description="Em torneios que só contenham atletas com idade menor ou igual a 18 anos e o jogador possua rating superior ou igual a 2100."
        />
        <RatingRule
          k={5}
          description="Em torneios que só contenham atletas com idade menor ou igual a 18 anos."
        />
        <RatingRule
          k={10}
          description="O enxadrista possua rating igual ou superior a 2300 pontos."
        />
        <RatingRule
          k={20}
          description="Nas demais situações."
          isLast
        />
      </div>
    )
  }
];
