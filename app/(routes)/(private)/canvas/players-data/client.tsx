"use client";

import React from "react";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import axios from "redaxios";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Client() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async () => {
    setSubmitting(true);
    if (selectedFile) {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          if (e.target?.result) {
            const data = new Uint8Array(e.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            // biome-ignore lint/suspicious/noExplicitAny: No
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              raw: false,
              dateNF: "yyyy-mm-dd",
            });

            const headerRow = jsonData[0];
            const headerMap = headerRow.reduce(
              (
                acc: { [key: string]: number },
                header: string,
                index: number
              ) => {
                acc[header] = index;
                return acc;
              },
              {}
            );

            for (let i = 1; i < jsonData.length; i++) {
              // biome-ignore lint/suspicious/noExplicitAny: No
              const row: any[] = jsonData[i];

              const id =
                headerMap.id !== undefined
                  ? Number.parseInt(row[headerMap.id])
                  : null;

              const name =
                headerMap.name !== undefined ? row[headerMap.name] : undefined;
              const birth =
                headerMap.birth !== undefined
                  ? row[headerMap.birth]
                  : undefined;
              const sex =
                headerMap.sex !== undefined ? row[headerMap.sex] : undefined;
              const clubId =
                headerMap.clubId !== undefined
                  ? Number.parseInt(row[headerMap.clubId])
                  : undefined;
              const locationId =
                headerMap.locationId !== undefined
                  ? Number.parseInt(row[headerMap.locationId])
                  : undefined;

              if (id === null) {
                alert("Mandatory column 'id' is missing.");
                setSubmitting(false);
                return;
              }

              const data = {
                ...(name !== undefined && { name }),
                ...(birth !== undefined && {
                  birth: birth.split("T")[0],
                }),
                ...(sex !== undefined && { sex }),
                ...(clubId !== undefined && { clubId }),
                ...(locationId !== undefined && { locationId }),
              };

              try {
                if (id === 0) {
                  const res = await axios.post("/api/players-data", data);
                } else {
                  const res = await axios.put(`/api/players-data/${id}`, data);
                }
              } catch (error) {
                console.error("Error updating player:", error, id);

                alert(
                  `Oops, there was an error updating the player ID: ${id}.`
                );
              }
            }
          }
          toast.success("Updated ratings");
          setSubmitting(false);
        };
        fileReader.readAsArrayBuffer(selectedFile);
      } catch (error) {
        alert(`Oops, there was an error processing the file. ${error}`);
      }
    } else {
      alert("Please select a file.");
    }
  };

  return (
    <div className="mx-auto my-0 min-h-screen w-11/12 max-w-[1080px] pt-4 pb-20 lg:grid lg:grid-cols-2">
      <section>
        <div className="mx-auto my-0 w-11/12 max-w-[400px] lg:w-full">
          <h2 className="mt-4 text-center font-semibold text-primary text-xl">
            Adicionar dados
          </h2>
          <form className="mt-8 text-primary">
            <div className="grid w-full items-center gap-6">
              <div className="flex flex-col gap-2 space-y-1.5">
                <Label htmlFor="fileUpload">Arquivo</Label>
                <Input onChange={handleFileChange} type="file" />
              </div>
            </div>
          </form>
          <div className="mt-6 flex gap-4">
            <Button onClick={onSubmit}>Adicionar</Button>
          </div>
        </div>
      </section>

      {submitting && "<Loader />"}
    </div>
  );
}
