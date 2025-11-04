import ldap, { SearchEntry, SearchOptions } from "ldapjs";
import dotenv from "dotenv";

dotenv.config();

// 🔠 DN içerisindeki escape edilmiş hex kodlarını UTF-8 olarak decode eden fonksiyon
function decodeLdapDn(dn: string): string {
  const hexMatches: number[] = [];
  let result = "";
  let i = 0;

  while (i < dn.length) {
    if (
      dn[i] === "\\" &&
      i + 2 < dn.length &&
      /^[0-9A-Fa-f]{2}$/.test(dn.substr(i + 1, 2))
    ) {
      hexMatches.push(parseInt(dn.substr(i + 1, 2), 16));
      i += 3;
    } else {
      if (hexMatches.length) {
        result += Buffer.from(hexMatches).toString("utf8");
        hexMatches.length = 0;
      }
      result += dn[i];
      i++;
    }
  }
  if (hexMatches.length) {
    result += Buffer.from(hexMatches).toString("utf8");
  }
  return result;
}

// 🧠 LDAP doğrulama fonksiyonu
const authenticate = async (username: string, password: string) => {
  return new Promise<string>((resolve, reject) => {
    let resolvedOrRejected = false; // Tek bir resolve/reject olsun diye koruma

    const client = ldap.createClient({
      url: process.env.LDAP_URL!,
      timeout: 10000, // 10 sn işlem süresi
      connectTimeout: 5000, // 5 sn bağlantı süresi
    });

    // 🧯 Bağlantı hatalarını yakala (ECONNRESET, ECONNREFUSED vb.)
    client.on("error", (err) => {
      console.error("LDAP client error:", err);
      if (!resolvedOrRejected) {
        resolvedOrRejected = true;
        reject("LDAP bağlantı hatası: " + err.message);
      }
    });

    // 1️⃣ Admin bind
    client.bind(process.env.LDAP_USERNAME!, process.env.LDAP_PASSWORD!, (err) => {
      if (err) {
        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          reject("LDAP Serverına admin olarak bağlanılamadı.");
        }
        client.unbind();
        return;
      }

      // 2️⃣ Kullanıcıyı arama
      const opts: SearchOptions = {
        filter: `(|(sAMAccountName=${username})(userPrincipalName=${username}))`,
        scope: "sub",
        attributes: [
          "dn",
          "sAMAccountName",
          "userPrincipalName",
          "cn",
          "givenName", // ad
          "sn", // soyad
          "mail", // e-posta
          "title",
          "telephoneNumber",
          "department",
          "company",
          "directReports",
          "userAccountControl",
          "accountExpires",
          "employeeID",
          "thumbnailPhoto",
          "jpegPhoto",
          "manager",
    "memberOf",
    "whenCreated"
        ],
      };

      client.search(process.env.LDAP_BASE_DN!, opts, (err, search) => {
        if (err) {
          if (!resolvedOrRejected) {
            resolvedOrRejected = true;
            reject("LDAP aramasında hata oluştu");
          }
          client.unbind();
          return;
        }

        let userInfo: any = null;

        search.on("searchEntry", (entry: SearchEntry) => {
          const attributes = entry.attributes.reduce<Record<string, string>>(
            (acc, attr) => {
              acc[attr.type] = Array.isArray(attr.values)
                ? attr.values[0]
                : attr.values;
              return acc;
            },
            {}
          );

          userInfo = {
            dn: entry.objectName ? decodeLdapDn(entry.objectName.toString()) : "",
            sAMAccountName: attributes["sAMAccountName"],
            userPrincipalName: attributes["userPrincipalName"],
            cn: attributes["cn"],
            givenName: attributes["givenName"],
            sn: attributes["sn"],
            mail: attributes["mail"],
            title:attributes["title"],
            telephoneNumber:attributes["telephoneNumber"],
            department:attributes["department"],
            company:attributes["company"],
            directReports:attributes["directReports"],
            userAccountControl:attributes["userAccountControl"],
            accountExpires:attributes["accountExpires"],
            employeeID:attributes["employeeID"],
            thumbnailPhoto:attributes["thumbnailPhoto"],
            jpegPhoto:attributes["jpegPhoto"],
            manager:["manager"],
            memberOf:attributes["memberOf"],
            whenCreated:attributes["whenCreated"],
          };

          console.log("Bulunan kullanıcı:", userInfo);
        });

        search.on("error", (err) => {
          console.error("LDAP search error:", err);
          if (!resolvedOrRejected) {
            resolvedOrRejected = true;
            reject("LDAP aramasında hata oluştu: " + err.message);
          }
          client.unbind();
        });

        search.on("end", () => {
          if (!userInfo?.dn) {
            if (!resolvedOrRejected) {
              resolvedOrRejected = true;
              reject("Kullanıcı bulunamadı");
            }
            client.unbind();
            return;
          }

          // 3️⃣ Kullanıcı bind
          const userClient = ldap.createClient({
            url: process.env.LDAP_URL!,
            timeout: 10000,
            connectTimeout: 5000,
          });

          userClient.on("error", (err) => {
            console.error("LDAP userClient error:", err);
          });

          userClient.bind(userInfo.dn, password, (err) => {
            userClient.unbind();
            client.unbind();

            if (err) {
              if (!resolvedOrRejected) {
                resolvedOrRejected = true;
                reject("Kullanıcı bilgileri hatalı");
              }
            } else {
              if (!resolvedOrRejected) {
                resolvedOrRejected = true;
                resolve(
                  `Kullanıcı doğrulandı: ${userInfo.cn ?? username} (${userInfo.mail ?? "mail yok"}) (${userInfo.title ?? "title yok"}) (${userInfo.telephoneNumber ?? "tel yok"})`
                );
              }
            }
          });
        });
      });
    });
  });
};

// 🔥 Server Action
export async function POST(request: Request) {
  const { username, password } = await request.json();

  try {
    const result = await authenticate(username, password);
    return new Response(JSON.stringify({ message: result }), { status: 200 });
  } catch (err) {
    console.error("LDAP Error:", err);
    return new Response(JSON.stringify({ error: err }), { status: 401 });
  }
}
