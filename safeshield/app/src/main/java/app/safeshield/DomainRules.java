package app.safeshield;

import java.net.IDN;
import java.util.*;
import java.io.*;

/** Immutable domain suffix matcher. No substring matching. */
public final class DomainRules {
    private final Set<String> domains;
    public DomainRules(Set<String> domains) { this.domains = Collections.unmodifiableSet(new HashSet<>(domains)); }
    public int size() { return domains.size(); }
    public boolean blocks(String name) {
        String d = normalize(name);
        while (!d.isEmpty()) {
            if (domains.contains(d)) return true;
            int dot = d.indexOf('.');
            if (dot < 0) break;
            d = d.substring(dot + 1);
        }
        return false;
    }
    public static String normalize(String name) {
        if (name == null) return "";
        try {
            String n = name.trim().toLowerCase(Locale.ROOT);
            if (n.endsWith(".")) n = n.substring(0, n.length()-1);
            n = IDN.toASCII(n, IDN.USE_STD3_ASCII_RULES);
            if (n.length() > 253 || !n.contains(".") || n.matches("[0-9.]+")) return "";
            for (String label : n.split("\\.", -1)) if (label.isEmpty() || label.length() > 63) return "";
            return n;
        } catch (IllegalArgumentException e) { return ""; }
    }
    public static DomainRules read(Reader input) throws IOException {
        Set<String> result = new HashSet<>();
        BufferedReader reader = new BufferedReader(input);
        String line;
        int lines = 0;
        while ((line = reader.readLine()) != null) {
            if (++lines > 1500000 || line.length() > 4096) throw new IOException("Blocklist exceeds safety limits");
            line = line.split("#", 2)[0].trim();
            if (line.isEmpty()) continue;
            String[] parts = line.split("\\s+");
            int start = (parts[0].equals("0.0.0.0") || parts[0].equals("127.0.0.1") || parts[0].equals("::")) ? 1 : 0;
            if (start == 0 && parts.length != 1) continue;
            for (int i=start; i<parts.length; i++) {
                String name = normalize(parts[i]);
                if (!name.isEmpty() && !name.endsWith(".local") && !name.equals("localhost.localdomain")) result.add(name);
            }
        }
        return new DomainRules(result);
    }
}
