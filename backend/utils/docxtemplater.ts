import fs from "fs";
import path from "path";
import moment from "moment";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

class Service {
  async submissionApproved(data: {
    title: string;
    list_consider: { no: string; text: string }[];
    list_observe: { no: string; text: string }[];
    list_decide: { no: string; text: string }[];
    date: string;
  }) {
    try {
      const content_file = fs.readFileSync(
        path.resolve(
          "public",
          "templates",
          "submission-approved-template.docx"
        ),
        "binary"
      );

      const zip = new PizZip(content_file);

      const doc = new Docxtemplater(zip);

      doc.render({
        ...data,
      });

      // remove the symbol of title
      const formattedTitle = data.title.replace(/[^a-zA-Z0-9]/g, "");

      const fileName = `SK ${formattedTitle}.docx`;

      const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      fs.writeFileSync(path.resolve("public", fileName), buffer);

      return fileName;
    } catch (error) {
      console.log(error);
      throw new Error("Gagal membuat borang pengajuan surat");
    }
  }
}

export const DocxTemplateService = new Service();
