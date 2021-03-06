<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CacheView extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        //
        DB::statement("rename table train_times_with_crs to x_train_times_with_crs");
        DB::statement("create index idx_train_times_rid on train_times (rid)");

        DB::statement(file_get_contents("/src/database/data/flat_train_times_with_crs.sql"));

        DB::statement("create table train_times_with_crs as select * from v_train_times_with_crs");

        DB::statement("create index crs on train_times_with_crs(from_crs, to_crs);");
        DB::statement("create index from_time on train_times_with_crs(from_time);");
        DB::statement("create index to_time on train_times_with_crs(to_time);");
        
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
        DB::statement("drop table train_times_with_crs");
        DB::statement("drop view v_train_times_with_crs");
        DB::statement("rename table x_train_times_with_crs to train_times_with_crs");
        DB::statement("alter table train_times drop index idx_train_times_rid");
    }
}
