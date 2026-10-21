package com.ronny.assistant.ui;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.text.format.DateFormat;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import com.ronny.assistant.R;
import com.ronny.assistant.alarm.AlarmScheduler;
import com.ronny.assistant.alarm.Notifier;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.TimeUtils;

import java.util.ArrayList;
import java.util.List;

/** Add, edit, delete, reorder-by-time and enable/disable the daily routine. */
public class RoutineActivity extends Activity {

    private static final int REQ_EDIT = 91;

    private ListView list;
    private TextView empty;
    private TextView subtitle;
    private final List<RoutineItem> items = new ArrayList<RoutineItem>();
    private Adapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_routine);

        list = findViewById(R.id.list);
        empty = findViewById(R.id.empty);
        subtitle = findViewById(R.id.subtitle);

        adapter = new Adapter();
        list.setAdapter(adapter);

        findViewById(R.id.btn_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        findViewById(R.id.btn_add).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivityForResult(
                        new Intent(RoutineActivity.this, EditActivity.class), REQ_EDIT);
            }
        });
        reload();
    }

    private void reload() {
        items.clear();
        items.addAll(RoutineDb.get(this).all());
        adapter.notifyDataSetChanged();
        empty.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
        list.setVisibility(items.isEmpty() ? View.GONE : View.VISIBLE);

        String day = TimeUtils.dayKey();
        int done = RoutineDb.get(this).doneCount(day);
        subtitle.setText(getString(R.string.dash_completed_of, done, items.size())
                + "  •  " + TimeUtils.longDate());
    }

    private void toggle(final RoutineItem item, boolean on) {
        RoutineDb.get(this).setEnabled(item.id, on);
        item.enabled = on;
        if (on) {
            AlarmScheduler.scheduleItem(this, item);
        } else {
            AlarmScheduler.cancelItem(this, item.id);
            Notifier.cancel(this, item.id);
        }
        Toast.makeText(this, item.title + (on ? " on" : " off"), Toast.LENGTH_SHORT).show();
    }

    private void confirmDelete(final RoutineItem item) {
        new AlertDialog.Builder(this)
                .setTitle(R.string.delete_confirm_title)
                .setMessage(getString(R.string.delete_confirm_body, item.title))
                .setPositiveButton(R.string.action_delete, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        RoutineDb.get(RoutineActivity.this).delete(item.id);
                        AlarmScheduler.cancelItem(RoutineActivity.this, item.id);
                        AlarmScheduler.cancelSnooze(RoutineActivity.this, item.id);
                        Notifier.cancel(RoutineActivity.this, item.id);
                        Toast.makeText(RoutineActivity.this, R.string.routine_deleted,
                                Toast.LENGTH_SHORT).show();
                        reload();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_EDIT) {
            AlarmScheduler.rescheduleAll(this);
            reload();
        }
    }

    private class Adapter extends BaseAdapter {

        @Override
        public int getCount() {
            return items.size();
        }

        @Override
        public Object getItem(int position) {
            return items.get(position);
        }

        @Override
        public long getItemId(int position) {
            return items.get(position).id;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            View v = convertView;
            if (v == null) {
                v = getLayoutInflater().inflate(R.layout.item_routine, parent, false);
            }
            final RoutineItem item = items.get(position);
            boolean is24 = DateFormat.is24HourFormat(RoutineActivity.this);
            boolean done = RoutineDb.get(RoutineActivity.this).isDone(TimeUtils.dayKey(), item.id);

            TextView emoji = v.findViewById(R.id.emoji);
            TextView title = v.findViewById(R.id.title);
            TextView time = v.findViewById(R.id.time);
            TextView days = v.findViewById(R.id.days);
            TextView badge = v.findViewById(R.id.badge);
            Switch enabled = v.findViewById(R.id.enabled);

            emoji.setText(item.emoji);
            emoji.setAlpha(item.enabled ? 1f : 0.4f);
            title.setText(item.title);
            time.setText(item.timeRangeLabel(is24));
            days.setText(TimeUtils.daysLabel(item.days));

            if (done) {
                badge.setVisibility(View.VISIBLE);
                badge.setText(R.string.dash_done);
                badge.setTextColor(getResources().getColor(R.color.success));
            } else {
                badge.setVisibility(View.GONE);
            }

            enabled.setOnCheckedChangeListener(null);
            enabled.setChecked(item.enabled);
            enabled.setOnCheckedChangeListener(
                    new android.widget.CompoundButton.OnCheckedChangeListener() {
                        @Override
                        public void onCheckedChanged(
                                android.widget.CompoundButton buttonView, boolean isChecked) {
                            toggle(item, isChecked);
                        }
                    });

            v.findViewById(R.id.btn_edit).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent i = new Intent(RoutineActivity.this, EditActivity.class);
                    i.putExtra(EditActivity.EXTRA_ITEM_ID, item.id);
                    startActivityForResult(i, REQ_EDIT);
                }
            });
            v.findViewById(R.id.btn_delete).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    confirmDelete(item);
                }
            });
            return v;
        }
    }
}
