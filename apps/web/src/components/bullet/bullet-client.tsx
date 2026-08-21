import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fsx/ui/components/accordion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fsx/ui/components/popover"
import { Separator } from "@fsx/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table"

export interface CupGame {
  id: number
  gameNumber: number
  link: string | null
  winnerId: number | null
}

export interface CupPlayerInfo {
  id: number
  name: string
  imageUrl: string | null
}

export interface CupMatch {
  id: number
  bestOf: number
  sortOrder: number
  date: string
  playerOne: CupPlayerInfo
  playerTwo: CupPlayerInfo
  winner: { id: number; name: string } | null
  cupGames: CupGame[]
}

export interface CupRound {
  id: number
  sortOrder: number
  cupMatches: CupMatch[]
}

export interface CupPlayer {
  id: number
  nickname: string | null
  position: number | null
  player: CupPlayerInfo
}

export interface CupGroup {
  id: number
  name: string
  sortOrder: number
  cupPlayers: CupPlayer[]
  cupRounds: CupRound[]
}

export interface CupPlayoff {
  id: number
  phaseType: string
  sortOrder: number
  cupMatches: CupMatch[]
}

export interface CupBracket {
  id: number
  bracketType: string
  cupPlayoffs: CupPlayoff[]
}

export interface Cup {
  id: number
  name: string
  imageUrl: string
  startDate: string
  endDate: string
  prizePool: number
  ratingType: string
  championshipId: number | null
  cupBrackets: CupBracket[]
  cupGroups: CupGroup[]
}

const prizeValues = ["R$ 100", "R$ 75", "R$ 60", "R$ 50", "R$ 40"]

function playerWins(match: CupMatch, playerId: number) {
  return match.cupGames.filter((game) => game.winnerId === playerId).length
}

function MatchGamesPopover({ match }: { match: CupMatch }) {
  return (
    <Popover>
      <PopoverTrigger className="absolute top-1/2 right-6 -translate-y-1/2 translate-x-1/2 rounded-full [&>svg]:fill-background">
        <HugeiconsIcon className="size-3.5" icon={InformationCircleIcon} />
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {match.cupGames.length === 0 && <div className="p-2">Sem partidas</div>}
        {match.cupGames.map((game) => (
          <div
            key={game.id}
            className="flex flex-col even:bg-secondary sm:flex-row"
          >
            <div className="flex items-center text-nowrap bg-muted px-2.5 py-1 text-xs sm:hidden">
              Jogo {game.gameNumber}
            </div>
            <GamePlayerCard
              id={match.playerOne.id}
              left
              name={match.playerOne.name}
              winner={game.winnerId}
            />
            <div className="hidden w-16 items-center justify-center text-nowrap text-xs sm:flex">
              Jogo {game.gameNumber}
            </div>
            <GamePlayerCard id={match.playerTwo.id} name={match.playerTwo.name} winner={game.winnerId} />
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function PlayoffPlayerCard({
  name,
  score,
  right,
  group,
}: {
  name: string
  score: number
  right?: boolean
  group?: boolean
}) {
  return (
    <div
      className={`flex justify-between bg-primary-foreground ${right && "lg:flex-row-reverse"} ${group && "w-full lg:rounded-sm"}`}
    >
      <p
        className={`truncate text-nowrap px-2.5 py-1 text-xs ${group ? "w-full text-center" : "w-[200px]"}`}
      >
        {name}
      </p>
      <div className="flex h-6 w-6 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
        {score}
      </div>
    </div>
  )
}

const GamePlayerCard = ({
  id,
  name,
  winner,
  left,
}: {
  id: number
  name: string
  winner: number | null
  left?: boolean
}) => {
  return (
    <div className={`flex justify-between bg-transparent ${!left && "sm:flex-row-reverse"}`}>
      <p className="w-[200px] truncate text-nowrap px-2.5 py-1 text-xs">{name}</p>
      <div className="flex h-6 w-6 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
        {id === winner ? 1 : 0}
      </div>
    </div>
  )
}

function calculatePlayerPoints(group: CupGroup) {
  const playerPoints: Record<number, number> = {}

  for (const round of group.cupRounds) {
    for (const match of round.cupMatches) {
      const playerOneId = match.playerOne?.id
      const playerTwoId = match.playerTwo?.id

      if (typeof playerOneId !== "number" || typeof playerTwoId !== "number") {
        continue
      }

      const playerOneWins = match.cupGames.filter((game) => game.winnerId === playerOneId).length
      const playerTwoWins = match.cupGames.filter((game) => game.winnerId === playerTwoId).length

      if (!playerPoints[playerOneId]) playerPoints[playerOneId] = 0
      if (!playerPoints[playerTwoId]) playerPoints[playerTwoId] = 0

      if (playerOneWins === 3 && playerTwoWins === 3) {
        playerPoints[playerOneId] += 1.5
        playerPoints[playerTwoId] += 1.5
      } else if (playerOneWins === 3) {
        if (playerTwoWins === 0 || playerTwoWins === 1) {
          playerPoints[playerOneId] += 3
        } else if (playerTwoWins === 2) {
          playerPoints[playerOneId] += 2
          playerPoints[playerTwoId] += 1
        }
      } else if (playerTwoWins === 3) {
        if (playerOneWins === 0 || playerOneWins === 1) {
          playerPoints[playerTwoId] += 3
        } else if (playerOneWins === 2) {
          playerPoints[playerTwoId] += 2
          playerPoints[playerOneId] += 1
        }
      }
    }
  }

  return playerPoints
}

function GroupPlayerTable({ group }: { group: CupGroup }) {
  const playerPoints = calculatePlayerPoints(group)

  const sortedPlayers = group.cupPlayers
    .map((player) => ({
      ...player,
      points: playerPoints[player.player.id] || 0,
    }))
    .sort((a, b) => b.points - a.points)

  return (
    <Table className="mt-4">
      <TableBody>
        {sortedPlayers.map((player, index) => (
          <TableRow key={player.id}>
            <TableCell className="w-10 tabular-nums">{index + 1}</TableCell>
            <TableCell className="flex items-center gap-4 text-nowrap">
              {player.nickname ?? player.player.name}
              {index < 2 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlight opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-highlight" />
                </span>
              )}
            </TableCell>
            <TableCell className="w-20 text-center tabular-nums">{player.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function InfoCard({ cup }: { cup: Cup }) {
  return (
    <div className="min-w-[250px] max-w-fit overflow-hidden rounded">
      <h3 className="bg-primary-foreground p-1.5 text-center font-medium">
        {cup.name}
      </h3>
      <img
        alt={cup.name}
        className="aspect-[3/2] w-full object-cover md:max-w-[250px]"
        decoding="async"
        loading="lazy"
        src={cup.imageUrl}
        title={cup.name}
      />
      <div className="grid grid-cols-2 text-sm">
        <div>
          <div className="flex justify-end py-1.5 pr-1">Ritmo:</div>
          <div className="flex justify-end bg-primary-foreground py-1.5 pr-1">
            Prêmio:
          </div>
          <div className="flex justify-end py-1.5 pr-1">Tipo:</div>
          <div className="flex justify-end bg-primary-foreground py-1.5 pr-1">
            Plataforma:
          </div>
          <div className="flex justify-end py-1.5 pr-1">Data de início:</div>
          <div className="flex justify-end bg-primary-foreground py-1.5 pr-1">
            Data de fim:
          </div>
        </div>
        <div>
          <div className="py-1.5 pl-1">{cup.ratingType}</div>
          <div className="bg-primary-foreground py-1.5 pl-1">
            R$ {cup.prizePool}
          </div>
          <div className="py-1.5 pl-1">Online</div>
          <div className="bg-primary-foreground py-1.5 pl-1">
            <a
              className="text-link"
              href="https://lichess.org"
              rel="noreferrer"
              target="_blank"
            >
              lichess.org
            </a>
          </div>
          <div className="py-1.5 pl-1">{cup.startDate}</div>
          <div className="bg-primary-foreground py-1.5 pl-1">
            {cup.endDate}
          </div>
        </div>
      </div>
    </div>
  )
}

function PrizeTable({ cup }: { cup: Cup }) {
  const champion =
    cup.cupBrackets
      .find((bracket) => bracket.bracketType === "GF")
      ?.cupPlayoffs.flatMap((playoff) => playoff.cupMatches)
      .find((match) => match.winner)?.winner ?? null

  return (
    <Table className="mt-4">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 min-w-10 text-nowrap text-xs">#</TableHead>
          <TableHead className="text-center text-nowrap text-xs">$ BRL</TableHead>
          <TableHead className="text-nowrap text-xs">Jogador</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((position) => (
          <TableRow key={position}>
            <TableCell
              className={`w-10 rounded-md p-0 !pl-0 tabular-nums
                ${position === 1 && "bg-yellow-500 text-white"}
                ${position === 2 && "bg-gray-500 text-white"}
                ${position === 3 && "bg-orange-500 text-white"}
              `}
            >
              {position}
            </TableCell>
            <TableCell className="text-center text-nowrap">{prizeValues[position - 1]}</TableCell>
            <TableCell className="text-nowrap">
              {position === 1 ? (champion?.name ?? "-") : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function BulletClient({ cup }: { cup: Cup }) {
  return (
    <>
      <section>
        <div className="py-8 md:py-12 md:pb-8">
          <h2 className="text-xl font-semibold">{cup.name}</h2>
          <Separator className="mt-1" />
        </div>
        <div className="md:flex md:flex-row-reverse items-start justify-between gap-8">
          <InfoCard cup={cup} />
          <div className="mt-6 md:mt-0">
            <p>
              Campeonato Sergipano Bullet de Xadrez é realizado de forma online no{" "}
              <a
                className="text-link hover:underline"
                href="https://lichess.org"
                rel="noreferrer"
                target="_blank"
              >
                lichess.org
              </a>
              . O torneio é dividido em duas fases: Fase de grupos e playoffs de
              eliminação dupla (chave dos vencedores e chave dos perdedores).
            </p>

            <div className="mt-6">
              <h3 className="text-lg font-medium">Formato</h3>
              <Separator />
              <ul className="list-inside list-disc [&>li]:mt-3">
                <li>
                  <b>Fase de Grupos</b>
                  <ul className="ml-6 list-inside list-disc">
                    <li>Dez grupos com 4 participantes cada</li>
                    <li>Todos jogam contra todos em melhor de 5</li>
                    <li>Vitória por 3x0 e 3x1 vale 3 pontos</li>
                    <li>Vitória por 3x2 vale 2 pontos</li>
                    <li>Empate vale 1.5 pontos</li>
                    <li>Derrota por 3x2 vale 1 ponto</li>
                    <li>
                      Os dois melhores de cada grupo se classificam para os Playoffs
                      Chave dos Vencedores
                    </li>
                    <li>
                      O terceiro e quarto colocados de cada grupo se classificam para
                      os Playoffs Chave dos Perdedores
                    </li>
                  </ul>
                </li>
                <li>
                  <b>Playoffs</b>
                  <ul className="ml-6 list-inside list-disc">
                    <li>
                      Dividido em Chave dos Vencedores, Chave dos Perdedores e Grande
                      Final
                    </li>
                    <li>
                      O jogador que perde seu confronto na Chave dos Vencedores cai
                      para a Chave dos Perdedores
                    </li>
                    <li>
                      O jogador que perde seu confronto na Chave dos Perdedores é
                      eliminado
                    </li>
                    <li>
                      Todas as partidas da Fase de Grupos, das Chaves dos Vencedores e
                      Perdedores serão melhor de 5.
                    </li>
                    <li>A Grande Final será melhor de 11</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium">Premiação</h3>
              <Separator />
              <p className="mt-3">O prêmio base é R$ 325.</p>
              <p>
                O valor arrecadado que exceder o prêmio base será adicionado ao valor
                final da premiação.
              </p>

              <PrizeTable cup={cup} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Fase de Grupos</h2>
        <Separator className="mt-1" />
        <div className="mt-8 flex flex-col gap-8 md:grid md:grid-cols-2">
          {cup.cupGroups.map((group) => (
            <div key={group.id}>
              <h3 className="w-20 truncate rounded-sm bg-primary px-3 py-1 text-center text-sm text-primary-foreground">
                Grupo {group.name}
              </h3>
              <GroupPlayerTable group={group} />
              <Accordion className="mt-4 grid gap-1">
                {group.cupRounds.map((round) => (
                  <AccordionItem className="border-none" key={round.id} value={String(round.sortOrder)}>
                    <AccordionTrigger className="w-20 flex-none justify-center rounded-sm bg-primary-foreground p-1 text-center text-xs text-nowrap truncate hover:no-underline">
                      Rodada {round.sortOrder}
                    </AccordionTrigger>
                    <AccordionContent className="mt-1 pb-0 overflow-hidden rounded-sm">
                      <div className="grid gap-1">
                        {round.cupMatches.map((match) => (
                          <div className="relative" key={match.id}>
                            <div className="flex w-full flex-col overflow-hidden rounded-sm lg:flex-row">
                              <PlayoffPlayerCard group name={match.playerOne.name} score={playerWins(match, match.playerOne.id)} />
                              <Separator orientation="vertical" />
                              <PlayoffPlayerCard group right name={match.playerTwo.name} score={playerWins(match, match.playerTwo.id)} />
                            </div>
                            <MatchGamesPopover match={match} />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-xl font-semibold">Playoffs</h2>
        <Separator className="mt-1" />
        <div className="playoffs mt-8 pb-12 overflow-x-scroll scroll-smooth">
          <div className="flex">
            <div className="grid gap-12">
              {cup.cupBrackets
                .filter((cupBracket) => cupBracket.bracketType === "UB")
                .map((bracket) => (
                  <div className="flex" key={bracket.bracketType}>
                    {bracket.cupPlayoffs.map((playoff) => (
                      <div className="ml-[286px] first:ml-0" key={playoff.id}>
                        <h3 className="rounded-sm bg-primary-foreground/60 p-1 text-center text-sm text-nowrap truncate">
                          {playoff.phaseType}
                        </h3>
                        <div className="grid h-full items-center gap-2 py-4">
                          {playoff.cupMatches.map((match) => (
                            <div key={match.id}>
                              <div className="relative w-fit">
                                <div className="rounded-sm border overflow-hidden">
                                  <PlayoffPlayerCard name={match.playerOne.name} score={playerWins(match, match.playerOne.id)} />
                                  <Separator />
                                  <PlayoffPlayerCard name={match.playerTwo.name} score={playerWins(match, match.playerTwo.id)} />
                                </div>
                                <MatchGamesPopover match={match} />

                                <div className="absolute top-1/2 right-0 h-0.5 w-10 translate-x-full bg-muted -translate-y-1/2" />

                                {playoff.sortOrder === 1 && (
                                  <>
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "bottom-[calc(50%-1px)]" : "top-[calc(50%-1px)]"} absolute -right-10 h-10 w-0.5 translate-x-full bg-muted`}
                                    />
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "hidden" : "top-[119%]"} absolute -right-10 h-0.5 w-[250px] translate-x-full bg-muted`}
                                    />
                                  </>
                                )}
                                {playoff.sortOrder === 2 && (
                                  <>
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "bottom-[calc(50%-1px)]" : "top-[calc(50%-1px)]"} absolute -right-10 h-20 w-0.5 translate-x-full bg-muted`}
                                    />
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "hidden" : "top-[175%]"} absolute -right-10 h-0.5 w-[250px] translate-x-full bg-muted`}
                                    />
                                  </>
                                )}
                                {playoff.sortOrder === 3 && (
                                  <>
                                    <div className="absolute top-[calc(50%-1px)] -right-10 h-[169px] w-0.5 translate-x-full bg-muted" />
                                    <div className="absolute top-[246%] -right-10 h-0.5 w-6 translate-x-full bg-muted" />
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {cup.cupBrackets
                .filter((cupBracket) => cupBracket.bracketType === "LB")
                .map((bracket) => (
                  <div className="flex" key={bracket.bracketType}>
                    {bracket.cupPlayoffs.map((playoff) => (
                      <div className="ml-[30px] first:ml-0" key={playoff.id}>
                        <h3 className="rounded-sm bg-primary-foreground/60 p-1 text-center text-sm text-nowrap truncate">
                          {playoff.phaseType}
                        </h3>
                        <div className="grid h-full items-center gap-2 py-4">
                          {playoff.cupMatches.map((match) => (
                            <div key={match.id}>
                              <div className="relative w-fit">
                                <div className="rounded-sm border overflow-hidden">
                                  <PlayoffPlayerCard name={match.playerOne.name} score={playerWins(match, match.playerOne.id)} />
                                  <Separator />
                                  <PlayoffPlayerCard name={match.playerTwo.name} score={playerWins(match, match.playerTwo.id)} />
                                </div>
                                <MatchGamesPopover match={match} />
                                {(playoff.sortOrder === 1 ||
                                  playoff.sortOrder === 3 ||
                                  playoff.sortOrder === 5) && (
                                  <div className="absolute top-1/2 right-0 h-0.5 w-7.5 translate-x-full bg-muted -translate-y-1/2" />
                                )}

                                {playoff.sortOrder === 2 && (
                                  <>
                                    <div className="absolute top-1/2 right-0 h-0.5 w-3.5 translate-x-full bg-muted -translate-y-1/2" />
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "bottom-[calc(50%-1px)]" : "top-[calc(50%-1px)]"} absolute -right-3.5 h-10 w-0.5 translate-x-full bg-muted`}
                                    />
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "hidden" : "top-[119%]"} absolute -right-4 h-0.5 w-3.5 translate-x-full bg-muted`}
                                    />
                                  </>
                                )}
                                {playoff.sortOrder === 4 && (
                                  <>
                                    <div className="absolute top-1/2 right-0 h-0.5 w-3.5 translate-x-full bg-muted -translate-y-1/2" />
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "bottom-[calc(50%-1px)]" : "top-[calc(50%-1px)]"} absolute -right-3.5 h-20 w-0.5 translate-x-full bg-muted`}
                                    />
                                    <div
                                      className={`${match.sortOrder % 2 === 0 ? "hidden" : "top-[175%]"} absolute -right-3.5 h-0.5 w-8 translate-x-full bg-muted`}
                                    />
                                  </>
                                )}

                                {playoff.sortOrder === 6 && (
                                  <>
                                    <div className="absolute top-1/2 right-0 h-0.5 w-10.5 translate-x-full bg-muted -translate-y-1/2" />
                                    <div className="absolute -top-[280%] -right-10 h-[169px] w-0.5 translate-x-full bg-muted" />
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            <div className="ml-16 pr-8">
              {cup.cupBrackets
                .filter((cupBracket) => cupBracket.bracketType === "GF")
                .map((bracket) => (
                  <div className="h-full" key={bracket.bracketType}>
                    {bracket.cupPlayoffs.map((playoff) => (
                      <div className="h-full" key={playoff.id}>
                        <h3 className="rounded-sm bg-primary-foreground/60 p-1 text-center text-sm text-nowrap truncate">
                          {playoff.phaseType}
                        </h3>
                        <div className="grid h-[calc(100%-16px)] items-center">
                          {playoff.cupMatches.map((match) => (
                            <div key={match.id}>
                              <div className="relative w-fit">
                                <div className="rounded-sm border overflow-hidden">
                                  <PlayoffPlayerCard name={match.playerOne.name} score={playerWins(match, match.playerOne.id)} />
                                  <Separator />
                                  <PlayoffPlayerCard name={match.playerTwo.name} score={playerWins(match, match.playerTwo.id)} />
                                </div>
                                <MatchGamesPopover match={match} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
