import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: {
    public_id: (req, file) => {
      const fileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-") // empty space (" ") -> (-)
        .replace(/\./g, "-") // (.) -> (-)
        .replace(/[^a-z0-9\-\.]/g, ""); // non alpha numeric - !@#$

      const extension = file.originalname.split(".").pop();

      // base 36 -> 0-9 and a-z // substring(2) -> 0.1243123 -> 1243123
      const uniqueFileName =
        Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileName + "." + extension;

      return uniqueFileName;
    },
  },
});

export const multerUpload = multer({ storage: storage });
