package com.ronny.assistant.data;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.ronny.assistant.model.RoutineItem;

import java.util.ArrayList;
import java.util.List;

/**
 * Local SQLite store. This is the single source of truth for the routine and it
 * lives entirely on the device, so every reminder keeps working offline.
 */
public class RoutineDb extends SQLiteOpenHelper {

    private static final String DB_NAME = "ronny.db";
    private static final int DB_VERSION = 1;

    private static final String T_ROUTINE = "routine";
    private static final String T_DONE = "progress";
    private static final String T_FIRED = "fired";

    private static RoutineDb instance;

    public static synchronized RoutineDb get(Context context) {
        if (instance == null) {
            instance = new RoutineDb(context.getApplicationContext());
        }
        return instance;
    }

    private RoutineDb(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE " + T_ROUTINE + " ("
                + "_id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "title TEXT NOT NULL, "
                + "message TEXT, "
                + "start_min INTEGER NOT NULL, "
                + "end_min INTEGER NOT NULL DEFAULT -1, "
                + "enabled INTEGER NOT NULL DEFAULT 1, "
                + "days INTEGER NOT NULL DEFAULT 127, "
                + "emoji TEXT DEFAULT '⏰', "
                + "sound TEXT DEFAULT 'chime', "
                + "voice INTEGER NOT NULL DEFAULT 1, "
                + "sort_order INTEGER NOT NULL DEFAULT 0)");

        db.execSQL("CREATE TABLE " + T_DONE + " ("
                + "day TEXT NOT NULL, item_id INTEGER NOT NULL, done_at INTEGER NOT NULL, "
                + "PRIMARY KEY (day, item_id))");

        db.execSQL("CREATE TABLE " + T_FIRED + " ("
                + "day TEXT NOT NULL, item_id INTEGER NOT NULL, fired_at INTEGER NOT NULL, "
                + "PRIMARY KEY (day, item_id))");

        seed(db);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Version 1 is the first release; a future version would migrate here
        // instead of dropping data.
        db.execSQL("DROP TABLE IF EXISTS " + T_ROUTINE);
        db.execSQL("DROP TABLE IF EXISTS " + T_DONE);
        db.execSQL("DROP TABLE IF EXISTS " + T_FIRED);
        onCreate(db);
    }

    private void seed(SQLiteDatabase db) {
        List<RoutineItem> items = DefaultRoutine.items();
        for (int i = 0; i < items.size(); i++) {
            RoutineItem item = items.get(i);
            item.sortOrder = i;
            insert(db, item);
        }
    }

    private static void insert(SQLiteDatabase db, RoutineItem item) {
        ContentValues v = toValues(item);
        db.insert(T_ROUTINE, null, v);
    }

    private static ContentValues toValues(RoutineItem item) {
        ContentValues v = new ContentValues();
        v.put("title", item.title);
        v.put("message", item.message);
        v.put("start_min", item.startMin);
        v.put("end_min", item.endMin);
        v.put("enabled", item.enabled ? 1 : 0);
        v.put("days", item.days);
        v.put("emoji", item.emoji);
        v.put("sound", item.sound);
        v.put("voice", item.voice ? 1 : 0);
        v.put("sort_order", item.sortOrder);
        return v;
    }

    private static RoutineItem fromCursor(Cursor c) {
        RoutineItem item = new RoutineItem();
        item.id = c.getLong(c.getColumnIndexOrThrow("_id"));
        item.title = c.getString(c.getColumnIndexOrThrow("title"));
        item.message = c.getString(c.getColumnIndexOrThrow("message"));
        item.startMin = c.getInt(c.getColumnIndexOrThrow("start_min"));
        item.endMin = c.getInt(c.getColumnIndexOrThrow("end_min"));
        item.enabled = c.getInt(c.getColumnIndexOrThrow("enabled")) == 1;
        item.days = c.getInt(c.getColumnIndexOrThrow("days"));
        item.emoji = c.getString(c.getColumnIndexOrThrow("emoji"));
        item.sound = c.getString(c.getColumnIndexOrThrow("sound"));
        item.voice = c.getInt(c.getColumnIndexOrThrow("voice")) == 1;
        item.sortOrder = c.getInt(c.getColumnIndexOrThrow("sort_order"));
        return item;
    }

    /** Every activity ordered by time of day. */
    public List<RoutineItem> all() {
        List<RoutineItem> out = new ArrayList<RoutineItem>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = null;
        try {
            c = db.query(T_ROUTINE, null, null, null, null, null, "start_min ASC, sort_order ASC");
            while (c.moveToNext()) {
                out.add(fromCursor(c));
            }
        } finally {
            if (c != null) {
                c.close();
            }
        }
        return out;
    }

    public RoutineItem get(long id) {
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = null;
        try {
            c = db.query(T_ROUTINE, null, "_id=?", new String[]{String.valueOf(id)}, null, null, null);
            if (c.moveToFirst()) {
                return fromCursor(c);
            }
        } finally {
            if (c != null) {
                c.close();
            }
        }
        return null;
    }

    public long save(RoutineItem item) {
        SQLiteDatabase db = getWritableDatabase();
        if (item.id > 0) {
            db.update(T_ROUTINE, toValues(item), "_id=?", new String[]{String.valueOf(item.id)});
            return item.id;
        }
        return db.insert(T_ROUTINE, null, toValues(item));
    }

    public void delete(long id) {
        SQLiteDatabase db = getWritableDatabase();
        db.delete(T_ROUTINE, "_id=?", new String[]{String.valueOf(id)});
        db.delete(T_DONE, "item_id=?", new String[]{String.valueOf(id)});
        db.delete(T_FIRED, "item_id=?", new String[]{String.valueOf(id)});
    }

    public void setEnabled(long id, boolean enabled) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("enabled", enabled ? 1 : 0);
        db.update(T_ROUTINE, v, "_id=?", new String[]{String.valueOf(id)});
    }

    /** ------------------------------------------------------------ progress */

    public boolean isDone(String day, long id) {
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = null;
        try {
            c = db.query(T_DONE, new String[]{"day"}, "day=? AND item_id=?",
                    new String[]{day, String.valueOf(id)}, null, null, null);
            return c.moveToFirst();
        } finally {
            if (c != null) {
                c.close();
            }
        }
    }

    public void markDone(String day, long id) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("day", day);
        v.put("item_id", id);
        v.put("done_at", System.currentTimeMillis());
        db.insertWithOnConflict(T_DONE, null, v, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public void unmarkDone(String day, long id) {
        getWritableDatabase().delete(T_DONE, "day=? AND item_id=?",
                new String[]{day, String.valueOf(id)});
    }

    public int doneCount(String day) {
        return count(T_DONE, day);
    }

    /** --------------------------------------------------------- fired guard */

    /**
     * True when this activity already rang for the given day. Used so a single
     * scheduled event cannot produce duplicate reminders after a reboot,
     * a time change or a re-schedule pass.
     */
    public boolean isFired(String day, long id) {
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = null;
        try {
            c = db.query(T_FIRED, new String[]{"day"}, "day=? AND item_id=?",
                    new String[]{day, String.valueOf(id)}, null, null, null);
            return c.moveToFirst();
        } finally {
            if (c != null) {
                c.close();
            }
        }
    }

    public void markFired(String day, long id) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("day", day);
        v.put("item_id", id);
        v.put("fired_at", System.currentTimeMillis());
        db.insertWithOnConflict(T_FIRED, null, v, SQLiteDatabase.CONFLICT_REPLACE);
    }

    /** Forget a single firing so a snoozed or re-armed reminder can ring again. */
    public void clearFired(String day, long id) {
        getWritableDatabase().delete(T_FIRED, "day=? AND item_id=?",
                new String[]{day, String.valueOf(id)});
    }

    public void clearFiredDay(String day) {
        getWritableDatabase().delete(T_FIRED, "day=?", new String[]{day});
    }

    private int count(String table, String day) {
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = null;
        try {
            c = db.rawQuery("SELECT COUNT(*) FROM " + table + " WHERE day=?", new String[]{day});
            if (c.moveToFirst()) {
                return c.getInt(0);
            }
        } finally {
            if (c != null) {
                c.close();
            }
        }
        return 0;
    }

    /** ------------------------------------------------------------- bulk ops */

    public void setAllEnabled(boolean enabled) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("enabled", enabled ? 1 : 0);
        db.update(T_ROUTINE, v, null, null);
    }

    public void resetToDefault() {
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            db.delete(T_ROUTINE, null, null);
            db.delete(T_DONE, null, null);
            db.delete(T_FIRED, null, null);
            seed(db);
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    public int count() {
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = null;
        try {
            c = db.rawQuery("SELECT COUNT(*) FROM " + T_ROUTINE, null);
            if (c.moveToFirst()) {
                return c.getInt(0);
            }
        } finally {
            if (c != null) {
                c.close();
            }
        }
        return 0;
    }
}
