"use client";
import { callChangePhoto, callUpdateUser } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import colors from "@/app/color/color";

export default function ProfilePic() {
  const { theme } = useTheme();
  const [editPic, setEditPic] = useState(false);
  const [image, setImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { auth, setAuth } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    if (editPic) {
      setTimeout(() => {
        setEditPic(false);
      }, 5000);
    }
  }, [editPic]);

  const handleImageClick = () => {
    inputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // ✅ Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      alert("Error: Only JPG, JPEG, and PNG files are allowed!");
      return;
    }

    setIsUploading(true); // 🔄 Show uploading message

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const imageData = reader.result;

      // ✅ Directly update auth and setImage at the same time
      setImage(imageData);
      setAuth((prevAuth) => ({ ...prevAuth, photo: imageData }));

      try {
        await callChangePhoto(auth.email, imageData);
        alert("Uploaded successfully!"); // ✅ Success alert
        await callUpdateUser(auth.email, auth.name, false);
      } catch (error) {
        alert("Error: Failed to upload the image!");
      } finally {
        setIsUploading(false); // ✅ Hide uploading message
      }
    };
  };

  useEffect(() => {
    if (auth?.photo) {
      setImage(auth.photo);
    }
  }, [auth]);

  const handleImageDelete = async () => {
    if (!auth) return;

    setImage("");
    setAuth((prevAuth) => ({ ...prevAuth, photo: "" }));

    try {
      await callChangePhoto(auth.email, "");
      alert("Profile picture deleted successfully!");
      await callUpdateUser(auth.email, auth.name, false);
    } catch (error) {
      alert("Error: Failed to delete profile picture!");
    }
  };

  return (
    <div className="w-full mt-5 relative">
      <div className="w-full flex items-center justify-center relative">
        <div
          className={`sm:w-[150px] w-[100px] sm:h-[150px] h-[100px] rounded-xl border-[1px] overflow-hidden flex items-center justify-center relative cursor-pointer ${colors.keyColorBorder}
          `}
          onClick={() => setEditPic((prev) => !prev)}
        >
          {isUploading ? ( // 🔄 Show uploading message
            <div
              className={`w-full h-full flex justify-center items-center text-lg font-bold ${
                theme ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              Uploading...
            </div>
          ) : image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <Image
                priority
                src={image}
                alt={theme ? "Proflie Icon Light" : "Proflie Icon Dark"}
                className="object-cover"
                width={500}
                height={500}
              />
          ) : (
            <div className={` h-full w-full relative`}>
              {" "}
              <Image
                priority
                src={theme ? "/profileIconLight.png" : "/profileIconDark.png"}
                alt={theme ? "Proflie Icon Light" : "Proflie Icon Dark"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {editPic && (
        <div className="w-full relative mt-2">
          <input
            className="hidden"
            type="file"
            name="file"
            ref={inputRef}
            accept="image/jpeg, image/jpg, image/png"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            className={`sm:py-2 py-1 ${colors.keyColorText} text-[12px] sm:text-[16px] rounded-lg border-[2px] ${colors.keyColorBorder} px-3 w-[56%] m-[2%] box-border float-left ${
              theme ? "" : ""
            }`}
            onClick={handleImageClick}
          >
            Upload
          </button>
          <button
            className={`sm:py-2 py-1 rounded-lg text-red-700 text-[12px] sm:text-[16px] border-[2px] border-red-700 px-3 w-[36%] m-[2%] box-border float-left ${
              theme ? "" : ""
            }`}
            onClick={handleImageDelete}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
