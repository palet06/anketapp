import ldap, { SearchEntry, SearchOptions} from "ldapjs";
import dotenv from "dotenv";

dotenv.config();

// DN içerisindeki escape edilmiş hex kodlarını UTF-8 olarak decode eden fonksiyon
function decodeLdapDn(dn: string): string {
 
  const hexMatches: number[] = [];
  let result = '';
  let i = 0;

  while (i < dn.length) {
    if (dn[i] === '\\' && i + 2 < dn.length && /^[0-9A-Fa-f]{2}$/.test(dn.substr(i + 1, 2))) {
      hexMatches.push(parseInt(dn.substr(i + 1, 2), 16));
      i += 3;
    } else {
      if (hexMatches.length) {
        result += Buffer.from(hexMatches).toString('utf8');
        hexMatches.length = 0;
      }
      result += dn[i];
      i++;
    }
  }
  if (hexMatches.length) {
    result += Buffer.from(hexMatches).toString('utf8');
  }

  return result;
}

// LDAP doğrulama fonksiyonu
const authenticate = async (username: string, password: string) => {
  return new Promise<string>((resolve, reject) => {
    const client = ldap.createClient({ url: process.env.LDAP_URL! });

    // 1️⃣ Admin bind
    client.bind(process.env.LDAP_USERNAME!, process.env.LDAP_PASSWORD!, (err) => {
      if (err) {
        reject("LDAP Serverına admin olarak bağlanılamadı.");
        return;
      }

      // 2️⃣ Kullanıcıyı arama
      const opts: SearchOptions = {
        filter: `(|(sAMAccountName=${username})(userPrincipalName=${username}))`,
        scope: "sub",
        attributes: ["dn", "sAMAccountName", "userPrincipalName", "cn"],
      };

      client.search(process.env.LDAP_BASE_DN!, opts, (err, search) => {
        if (err) {
          reject("LDAP aramasında hata oluştu");
          return;
        }

        let userDN: string | null = null;

        search.on("searchEntry", (entry: SearchEntry) => {
          userDN = decodeLdapDn(entry.dn.toString());
          
        });

        search.on("error", (err) => {
          reject("LDAP aramasında hata oluştu.");
          client.unbind();
        });

        search.on("end", () => {
          if (!userDN) {
            reject("Kullanıcı bulunamadı");
            client.unbind();
            return;
          }

          // 3️⃣ Kullanıcı bind
          const userClient = ldap.createClient({ url: process.env.LDAP_URL! });
          userClient.bind(userDN, password, (err) => {
            if (err) {
              reject("Kullancı bilgileri hatalı");
            } else {
              resolve("Kullanıcı doğrulandı");
            }
            userClient.unbind();
            client.unbind();
          });
        });
      });
    });
  });
};

// Server Action
export async function POST(request: Request) {
  const { username, password } = await request.json();

  try {
    const result = await authenticate(username, password);
    return new Response(JSON.stringify({ message: result }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err }), { status: 401 });
  }
}
