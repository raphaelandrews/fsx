import z from "zod";

const createFormSchema = () => {
  const fileSchema = z
    .instanceof(File, { message: "Please select a file." })
    .refine(
      (file) => {
        if (!file) return false;
        const allowedExtensions = [".xlsx", ".xls"];
        const fileExtension = file.name
          .substring(file.name.lastIndexOf("."))
          .toLowerCase();
        return allowedExtensions.includes(fileExtension);
      },
      {
        message: "Only Excel files (.xlsx, .xls) are allowed.",
      }
    );

  return z.object({
    file: fileSchema,
  });
};

export const formSchema = createFormSchema();
