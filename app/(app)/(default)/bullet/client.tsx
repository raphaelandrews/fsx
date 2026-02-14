import React from "react";
import { InfoIcon } from "lucide-react";

import type { Cup, CupGroup } from "./types";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const prizeValues = ["R$ 100", "R$ 75", "R$ 60", "R$ 50", "R$ 40"];

export function Client({ cup }: { cup: Cup }) {
  return (
    <>
      <section>
        <Title label={cup.name} />
        <div className="md:flex md:flex-row-reverse justify-between items-start gap-8">
          <InfoCard
            label={cup.name}
            image_url={cup.image_url}
            start_date={cup.start_date}
            end_date={cup.end_date}
            prize_pool={cup.prize_pool}
            rhythm={cup.rhythm}
          />
          <div className="mt-6 md:mt-0">
            <p>
              Campeonato Sergipano Bullet de Xadrez é realizado de forma online
              no{" "}
              <a
                href="https://lichess.org"
                target="_blank"
                rel="noreferrer"
                className="text-link hover:underline"
              >
                lichess.org
              </a>
              . O torneio é dividido em duas fases: Fase de grupos e playoffs de
              eliminação dupla (chave dos vencedores e chave dos perdedores).
            </p>

            <div className="mt-6">
              <h3 className="font-medium text-lg">Formato</h3>
              <Separator />
              <ul className="[&>li]:mt-3 list-disc list-inside">
                <li>
                  <b>Fase de Grupos</b>
                  <ul className="ml-6 list-disc list-inside">
                    <li>Dez grupos com 4 participantes cada</li>
                    <li>Todos jogam contra todos em melhor de 5</li>
                    <li>Vitória por 3x0 e 3x1 vale 3 pontos</li>
                    <li>Vitória por 3x2 vale 2 pontos</li>
                    <li>Empate vale 1.5 pontos</li>
                    <li>Derrota por 3x2 vale 1 ponto</li>
                    <li>
                      Os dois melhores de cada grupo se classificam para os
                      Playoffs Chave dos Vencedores
                    </li>
                    <li>
                      O terceiro e quarto colocados de cada grupo se classificam
                      para os Playoffs Chave dos Perdedores
                    </li>
                  </ul>
                </li>
                <li>
                  <b>Playoffs</b>
                  <ul className="ml-6 list-disc list-inside">
                    <li>
                      Dividido em Chave dos Vencedores, Chave dos Perdedores e
                      Grande Final
                    </li>
                    <li>
                      O jogador que perde seu confronto na Chave dos Vencendores
                      cai para a Chave dos Perdedores
                    </li>
                    <li>
                      O jogador que perde seu confronto na Chave dos Perdedores
                      é eliminado
                    </li>
                    <li>
                      Todas as partidas da Fase de Grupos, das Chaves dos
                      Vencedores e Perdedores serão melhor de 5.
                    </li>
                    <li>A Grande Final será melhor de 11</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-lg">Premiação</h3>
              <Separator />
              <p className="mt-3">O prêmio base é R$ 325.</p>
              <p>
                O valor arrecadado que exceder o prêmio base será adicionado ao
                valor final da premiação.
              </p>

              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs text-nowrap w-10 min-w-10">
                      #
                    </TableHead>
                    <TableHead className="text-xs text-center text-nowrap">
                      $ BRL
                    </TableHead>
                    <TableHead className="text-xs text-nowrap">
                      Jogador
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cup.cup_podium.slice(0, 5).map((podium) => (
                    <React.Fragment key={podium.id}>
                      <TableRow>
                        <TableCell
                          className={`w-10 rounded-md p-0 !pl-0
                                ${podium.position === 1 &&
                            "text-white bg-yellow-500"
                            } 
                                ${podium.position === 2 &&
                            "text-white bg-gray-500"
                            }
                                ${podium.position === 3 &&
                            "text-white bg-orange-500"
                            }
                              `}
                        >
                          {podium.position}
                        </TableCell>
                        <TableCell className="text-center text-nowrap">
                          {
                            prizeValues[
                            (podium.position ? podium.position : 0) - 1
                            ]
                          }
                        </TableCell>
                        <TableCell className="text-nowrap">
                          {podium.players.name}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-semibold text-xl">Fase de Grupos</h2>
        <Separator className="mt-1" />
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 mt-8">
          {cup.cup_groups.map((group) => {
            return (
              <div key={group.id}>
                <h3 className="dark:font-semibold text-sm text-center text-primary-foreground truncate w-20 px-3 py-1 bg-primary rounded-sm">
                  Grupo {group.name}
                </h3>
                {renderPlayerTable(group)}
                <Accordion
                  type="single"
                  collapsible
                  className="grid gap-1 mt-4"
                >
                  {group.cup_rounds.map((round) => (
                    <AccordionItem
                      key={round.order}
                      value={round.order.toString()}
                      className="border-none"
                    >
                      <AccordionTrigger className="flex-none justify-center text-xs text-center text-nowrap truncate w-20 p-1 bg-primary-foreground rounded-sm hover:no-underline [&>svg]:hidden">
                        Rodada {round.order}
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 mt-1 rounded-sm overflow-hidden">
                        <div className="grid gap-1">
                          {round.cup_matches.map((match) => {
                            const playerOneWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_one_id.id
                            ).length;

                            const playerTwoWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_two_id.id
                            ).length;

                            return (
                              <div key={match.id}>
                                <div className="relative">
                                  <div className="flex flex-col lg:flex-row w-full rounded-sm overflow-hidden">
                                    <PlayoffPlayerCard
                                      name={match.player_one_id.name}
                                      score={playerOneWins}
                                      group={true}
                                    />
                                    <Separator orientation="vertical" />
                                    <PlayoffPlayerCard
                                      name={match.player_two_id.name}
                                      score={playerTwoWins}
                                      right={true}
                                      group={true}
                                    />
                                  </div>
                                  <Popover>
                                    <PopoverTrigger className="absolute top-1/2 right-6 lg:right-1/2 -translate-y-1/2 translate-x-1/2 rounded-full [&>svg]:fill-background">
                                      <InfoIcon width={14} height={14} />
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                      {match.cup_games.length === 0 && (
                                        <div className="p-2">Sem partidas</div>
                                      )}
                                      {match.cup_games.map((game) => (
                                        <div
                                          key={game.id}
                                          className="flex flex-col sm:flex-row even:bg-secondary dark:even:bg-primary-foreground/60"
                                        >
                                          <div className="flex sm:hidden items-center text-xs text-nowrap px-2.5 py-1 bg-muted">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_one_id.id
                                                ? match.player_one_id.id
                                                : 0
                                            }
                                            name={match.player_one_id.name}
                                            winner={game.winner_id}
                                            left={true}
                                          />
                                          <div className="hidden sm:flex justify-center items-center text-xs text-nowrap w-16">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_two_id.id
                                                ? match.player_two_id.id
                                                : 0
                                            }
                                            name={match.player_two_id.name}
                                            winner={game.winner_id}
                                          />
                                        </div>
                                      ))}
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-semibold text-xl">Playoffs</h2>
        <Separator className="mt-1" />
        <div className="playoffs mt-8 pb-12 overflow-x-scroll scroll-smooth">
          <div className="flex">
            <div className="grid gap-12">
              {cup.cup_brackets
                .filter((cupBracket) => cupBracket.bracket_type === "UB")
                .map((bracket) => (
                  <div key={bracket.bracket_type} className="flex">
                    {bracket.cup_playoffs.map((playoff) => (
                      <div
                        key={playoff.phase_type}
                        className="first:ml-0 ml-[286px]"
                      >
                        <h3 className="text-sm text-center text-nowrap truncate p-1 bg-primary-foreground/60 rounded-sm">
                          {playoff.phase_type}
                        </h3>
                        <div className="grid items-center gap-2 h-full py-4">
                          {playoff.cup_matches.map((match) => {
                            const playerOneWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_one_id.id
                            ).length;

                            const playerTwoWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_two_id.id
                            ).length;

                            return (
                              <div key={match.id}>
                                <div className="relative w-fit">
                                  <div className="border rounded-sm overflow-hidden">
                                    <PlayoffPlayerCard
                                      name={match.player_one_id.name}
                                      score={playerOneWins}
                                    />
                                    <Separator />
                                    <PlayoffPlayerCard
                                      name={match.player_two_id.name}
                                      score={playerTwoWins}
                                    />
                                  </div>
                                  <Popover>
                                    <PopoverTrigger className="absolute top-1/2 right-6 -translate-y-1/2 translate-x-1/2 rounded-full [&>svg]:fill-background">
                                      <InfoIcon width={14} height={14} />
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                      {match.cup_games.length === 0 && (
                                        <div className="p-2">Sem partidas</div>
                                      )}
                                      {match.cup_games.map((game) => (
                                        <div
                                          key={game.id}
                                          className="flex flex-col sm:flex-row even:bg-secondary dark:even:bg-primary-foreground/60"
                                        >
                                          <div className="flex sm:hidden items-center text-xs text-nowrap px-2.5 py-1 bg-muted">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_one_id.id
                                                ? match.player_one_id.id
                                                : 0
                                            }
                                            name={match.player_one_id.name}
                                            winner={game.winner_id}
                                            left={true}
                                          />
                                          <div className="hidden sm:flex justify-center items-center text-xs text-nowrap w-16">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_two_id.id
                                                ? match.player_two_id.id
                                                : 0
                                            }
                                            name={match.player_two_id.name}
                                            winner={game.winner_id}
                                          />
                                        </div>
                                      ))}
                                    </PopoverContent>
                                  </Popover>

                                  <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-10 h-0.5 bg-muted" />

                                  {playoff.order === 1 && (
                                    <>
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "bottom-[calc(50%-1px)]"
                                            : "top-[calc(50%-1px)]"
                                          } absolute -right-10 translate-x-full w-0.5 h-10 bg-muted`}
                                      />
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "hidden"
                                            : "top-[119%]"
                                          } absolute -right-10 translate-x-full w-[250px] h-0.5 bg-muted`}
                                      />
                                    </>
                                  )}
                                  {playoff.order === 2 && (
                                    <>
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "bottom-[calc(50%-1px)]"
                                            : "top-[calc(50%-1px)]"
                                          } absolute -right-10 translate-x-full w-0.5 h-20 bg-muted`}
                                      />
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "hidden"
                                            : "top-[175%]"
                                          } absolute -right-10 translate-x-full w-[250px] h-0.5 bg-muted`}
                                      />
                                    </>
                                  )}
                                  {playoff.order === 3 && (
                                    <>
                                      <div className="absolute top-[calc(50%-1px)] -right-10 translate-x-full w-0.5 h-[169px] bg-muted" />
                                      <div className="absolute top-[246%] -right-10 translate-x-full w-6 h-0.5 bg-muted" />
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {cup.cup_brackets
                .filter((cupBracket) => cupBracket.bracket_type === "LB")
                .map((bracket) => (
                  <div key={bracket.bracket_type} className="flex">
                    {bracket.cup_playoffs.map((playoff) => (
                      <div
                        key={playoff.phase_type}
                        className="first:ml-0 ml-[30px]"
                      >
                        <h3 className="text-sm text-center text-nowrap truncate p-1 bg-primary-foreground/60 rounded-sm">
                          {playoff.phase_type}
                        </h3>
                        <div className="grid items-center gap-2 h-full py-4">
                          {playoff.cup_matches.map((match) => {
                            const playerOneWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_one_id.id
                            ).length;

                            const playerTwoWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_two_id.id
                            ).length;
                            return (
                              <div key={match.id}>
                                <div className="relative w-fit">
                                  <div className="border rounded-sm overflow-hidden">
                                    <PlayoffPlayerCard
                                      name={match.player_one_id.name}
                                      score={playerOneWins}
                                    />
                                    <Separator />
                                    <PlayoffPlayerCard
                                      name={match.player_two_id.name}
                                      score={playerTwoWins}
                                    />
                                  </div>
                                  <Popover>
                                    <PopoverTrigger className="absolute top-1/2 right-6 -translate-y-1/2 translate-x-1/2 rounded-full [&>svg]:fill-background">
                                      <InfoIcon width={14} height={14} />
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 overflow-hidden">
                                      {match.cup_games.length === 0 && (
                                        <div className="p-2">Sem partidas</div>
                                      )}
                                      {match.cup_games.map((game) => (
                                        <div
                                          key={game.id}
                                          className="flex flex-col sm:flex-row even:bg-secondary dark:even:bg-primary-foreground/60"
                                        >
                                          <div className="flex sm:hidden items-center text-xs text-nowrap px-2.5 py-1 bg-muted">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_one_id.id
                                                ? match.player_one_id.id
                                                : 0
                                            }
                                            name={match.player_one_id.name}
                                            winner={game.winner_id}
                                            left={true}
                                          />
                                          <div className="hidden sm:flex justify-center items-center text-xs text-nowrap w-16">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_two_id.id
                                                ? match.player_two_id.id
                                                : 0
                                            }
                                            name={match.player_two_id.name}
                                            winner={game.winner_id}
                                          />
                                        </div>
                                      ))}
                                    </PopoverContent>
                                  </Popover>
                                  {(playoff.order === 1 ||
                                    playoff.order === 3 ||
                                    playoff.order === 5) && (
                                      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-7.5 h-0.5 bg-muted" />
                                    )}

                                  {playoff.order === 2 && (
                                    <>
                                      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-3.5 h-0.5 bg-muted" />
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "bottom-[calc(50%-1px)]"
                                            : "top-[calc(50%-1px)]"
                                          } absolute -right-3.5 translate-x-full w-0.5 h-10 bg-muted`}
                                      />
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "hidden"
                                            : "top-[119%]"
                                          } absolute -right-4 translate-x-full w-3.5 h-0.5 bg-muted`}
                                      />
                                    </>
                                  )}
                                  {playoff.order === 4 && (
                                    <>
                                      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-3.5 h-0.5 bg-muted" />
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "bottom-[calc(50%-1px)]"
                                            : "top-[calc(50%-1px)]"
                                          } absolute -right-3.5 translate-x-full w-0.5 h-20 bg-muted`}
                                      />
                                      <div
                                        className={`${match.order % 2 === 0
                                            ? "hidden"
                                            : "top-[175%]"
                                          } absolute -right-3.5 translate-x-full w-8 h-0.5 bg-muted`}
                                      />
                                    </>
                                  )}

                                  {playoff.order === 6 && (
                                    <>
                                      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-10.5 h-0.5 bg-muted" />
                                      <div className="absolute -top-[280%] -right-10 translate-x-full w-0.5 h-[169px] bg-muted" />
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            <div className="ml-16 pr-8">
              {cup.cup_brackets
                .filter((cupBracket) => cupBracket.bracket_type === "GF")
                .map((bracket) => (
                  <div key={bracket.bracket_type} className="h-full">
                    {bracket.cup_playoffs.map((playoff) => (
                      <div key={playoff.phase_type} className="h-full">
                        <h3 className="text-sm text-center text-nowrap truncate p-1 bg-primary-foreground/60 rounded-sm">
                          {playoff.phase_type}
                        </h3>
                        <div className="grid items-center h-[calc(100%-16px)]">
                          {playoff.cup_matches.map((match) => {
                            const playerOneWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_one_id.id
                            ).length;

                            const playerTwoWins = match.cup_games.filter(
                              (game) =>
                                game.winner_id === match.player_two_id.id
                            ).length;

                            return (
                              <div key={match.id}>
                                <div className="relative w-fit">
                                  <div className="border rounded-sm overflow-hidden">
                                    <PlayoffPlayerCard
                                      name={match.player_one_id.name}
                                      score={playerOneWins}
                                    />
                                    <Separator />
                                    <PlayoffPlayerCard
                                      name={match.player_two_id.name}
                                      score={playerTwoWins}
                                    />
                                  </div>
                                  <Popover>
                                    <PopoverTrigger className="absolute top-1/2 right-6 -translate-y-1/2 translate-x-1/2 rounded-full [&>svg]:fill-background">
                                      <InfoIcon width={14} height={14} />
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                      {match.cup_games.length === 0 && (
                                        <div className="p-2">Sem partidas</div>
                                      )}
                                      {match.cup_games.map((game) => (
                                        <div
                                          key={game.id}
                                          className="flex flex-col sm:flex-row even:bg-secondary dark:even:bg-primary-foreground/60"
                                        >
                                          <div className="flex sm:hidden items-center text-xs text-nowrap px-2.5 py-1 bg-muted">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_one_id.id
                                                ? match.player_one_id.id
                                                : 0
                                            }
                                            name={match.player_one_id.name}
                                            winner={game.winner_id}
                                            left={true}
                                          />
                                          <div className="hidden sm:flex justify-center items-center text-xs text-nowrap w-16">
                                            Jogo {game.game_number}
                                          </div>
                                          <GamePlayerCard
                                            id={
                                              match.player_two_id.id
                                                ? match.player_two_id.id
                                                : 0
                                            }
                                            name={match.player_two_id.name}
                                            winner={game.winner_id}
                                          />
                                        </div>
                                      ))}
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            );
                          })}
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
  );
}

const PlayoffPlayerCard = ({
  name,
  score,
  right,
  group,
}: {
  name: string;
  score: number;
  right?: boolean;
  group?: boolean;
}) => {
  return (
    <div
      className={`flex justify-between bg-primary-foreground ${right && "lg:flex-row-reverse"
        } ${group && "w-full lg:rounded-sm"}`}
    >
      <p
        className={`text-xs text-nowrap truncate py-1 px-2.5 ${group ? "text-center w-full" : "w-[200px]"
          }`}
      >
        {name}
      </p>
      <div className="flex justify-center items-center dark:font-semibold text-sm text-primary-foreground bg-primary w-6 h-6">
        {score}
      </div>
    </div>
  );
};

const GamePlayerCard = ({
  id,
  name,
  winner,
  left,
}: {
  id: number;
  name: string;
  winner: number | null;
  left?: boolean;
}) => {
  return (
    <div
      className={`flex justify-between bg-transparent ${!left && "sm:flex-row-reverse"
        }`}
    >
      <p className="text-xs text-nowrap truncate w-[200px] py-1 px-2.5 ">
        {name}
      </p>
      <div className="flex justify-center items-center dark:font-semibold text-sm text-primary-foreground bg-primary w-6 h-6">
        {id === winner ? 1 : 0}
      </div>
    </div>
  );
};

function calculatePlayerPoints(group: CupGroup) {
  const playerPoints: Record<number, number> = {};

  for (const round of group.cup_rounds) {
    for (const match of round.cup_matches) {
      const playerOneId = match.player_one_id?.id;
      const playerTwoId = match.player_two_id?.id;

      if (typeof playerOneId !== "number" || typeof playerTwoId !== "number") {
        continue;
      }

      const playerOneWins = match.cup_games.filter(
        (game) => game.winner_id === playerOneId
      ).length;

      const playerTwoWins = match.cup_games.filter(
        (game) => game.winner_id === playerTwoId
      ).length;

      if (!playerPoints[playerOneId]) playerPoints[playerOneId] = 0;
      if (!playerPoints[playerTwoId]) playerPoints[playerTwoId] = 0;

      if (playerOneWins === 3 && playerTwoWins === 3) {
        playerPoints[playerOneId] += 1.5;
        playerPoints[playerTwoId] += 1.5;
      } else if (playerOneWins === 3) {
        if (playerTwoWins === 0 || playerTwoWins === 1) {
          playerPoints[playerOneId] += 3;
          playerPoints[playerTwoId] += 0;
        } else if (playerTwoWins === 2) {
          playerPoints[playerOneId] += 2;
          playerPoints[playerTwoId] += 1;
        }
      } else if (playerTwoWins === 3) {
        if (playerOneWins === 0 || playerOneWins === 1) {
          playerPoints[playerTwoId] += 3;
          playerPoints[playerOneId] += 0;
        } else if (playerOneWins === 2) {
          playerPoints[playerTwoId] += 2;
          playerPoints[playerOneId] += 1;
        }
      }
    }
  }

  return playerPoints;
}

function renderPlayerTable(group: CupGroup) {
  const playerPoints = calculatePlayerPoints(group);

  const sortedPlayers = group.cup_players
    .map((player) => ({
      ...player,
      points: playerPoints[player.id] || 0,
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <Table key={group.id} className="mt-4">
      <TableBody>
        {sortedPlayers.map((player, index) => (
          <TableRow key={player.id}>
            <TableCell className="w-10">{index + 1}</TableCell>
            <TableCell className="flex items-center gap-4 text-nowrap">
              {player.players.name}
              {index < 2 && (
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-highlight opacity-75" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-highlight" />
                </span>
              )}
            </TableCell>
            <TableCell className="text-center w-20">{player.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const Title = ({ label }: { label: string }) => {
  return (
    <div className="py-8 md:py-12 md:pb-8">
      <h2 className="font-semibold text-xl">{label}</h2>
      <Separator className="mt-1" />
    </div>
  );
};

interface InfoCardProps {
  label: string;
  image_url: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  rhythm: string;
}

const InfoCard = ({
  label,
  start_date,
  end_date,
  prize_pool,
  rhythm,
}: InfoCardProps) => {
  return (
    <div className="max-w-fit rounded overflow-hidden min-w-[250px]">
      <h3 className="font-medium text-center p-1.5 bg-primary-foreground dark:bg-primary-foreground/60">
        {label}
      </h3>
      {/** biome-ignore lint/performance/noImgElement: No */}
      <img
        src="/og/og.jpg"
        alt={label}
        title={label}
        className="w-full md:max-w-[250px] aspect-[3/2] object-cover"
      />
      <div className="grid grid-cols-2 text-sm">
        <div>
          <div className="flex justify-end py-1.5 pr-1">Ritmo:</div>
          <div className="flex justify-end py-1.5 pr-1 bg-primary-foreground dark:bg-primary-foreground/60">
            Prêmio:
          </div>
          <div className="flex justify-end py-1.5 pr-1">Tipo:</div>
          <div className="flex justify-end py-1.5 pr-1 bg-primary-foreground dark:bg-primary-foreground/60">
            Plataforma:
          </div>
          <div className="flex justify-end py-1.5 pr-1">Data de início:</div>
          <div className="flex justify-end py-1.5 pr-1 bg-primary-foreground dark:bg-primary-foreground/60">
            Data de fim:
          </div>
        </div>
        <div>
          <div className="py-1.5 pl-1">{rhythm}</div>
          <div className="py-1.5 pl-1 bg-primary-foreground dark:bg-primary-foreground/60">
            R$ {prize_pool}
          </div>
          <div className="py-1.5 pl-1">Online</div>
          <div className="py-1.5 pl-1 bg-primary-foreground dark:bg-primary-foreground/60">
            <a
              href="https://lichess.org"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              lichess.org
            </a>
          </div>
          <div className="py-1.5 pl-1">{start_date}</div>
          <div className="py-1.5 pl-1 bg-primary-foreground dark:bg-primary-foreground/60">
            {end_date}
          </div>
        </div>
      </div>
    </div>
  );
};
