/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "lh3.googleusercontent.com",
          },
          {
            protocol: "https",
            hostname: "avatars.githubusercontent.com", // optional: if you use GitHub auth too
          },
        ],
      },
};

export default nextConfig;
