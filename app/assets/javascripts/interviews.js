$(function () {
    if ($('.flexible_schedule_interviews').length > 0) {

        $('.flexible_schedule_interviews').click(function(event) {
            var opening_candidate_id = $('#opening_candidate_id').val();
            if (opening_candidate_id) {
                window.location = '/interviews/edit_multiple?opening_candidate_id=' + opening_candidate_id;
            } else {
                $('#opening_selection').load('/interviews/schedule_opening_selection', function(response, status) {
                    if (status == 'success') {
                        $(this).find('select#department_id').attr('name', null);
                        $(this).find('#openingid_select_wrapper').attr('id', 'interview_openingid_select_wrapper');
                        $(this).find('select#opening_id').attr('name', 'opening_id');
                        $(this).dialog({
                            modal: true,
                            title: "Select Opening",
                            width : '450px'});
                    }
                });
            }
        });


        $('body').delegate('select#department_id', 'change', function(event) {
            var select_wrapper = $('#interview_openingid_select_wrapper');
            $('select', select_wrapper).attr('disabled', true);
            var department_id = $(this).val();
            var url = '/positions/opening_options?selected_department_id=' + department_id;
            return select_wrapper.load(url, function() {
                $('select#opening_id').attr('name', 'opening_id');
            });
        });
    }

    if ($('.interview-feedback-btn').length > 0) {
        $('.interview-feedback-btn').click(function(event){
            var interview_id = $(this).attr('data-interview-id');
            var div_id = "interview-feedback-dialog-" + interview_id;
            $("div#" + div_id).dialog({
                height: 500,
                width: 600,
                modal: true,
                title: 'Add Feedback'
            });
        });
    }

    function setup_datetimepicker(elements) {
        $(elements).datetimepicker().each(function(index, elem) {
            var isoTime = new Date($(elem).data('iso'));
            var new_id = elem.id.replace("scheduled_at", "scheduled_at_iso");
            if (new_id != elem.id) {
                var iso_elem = $("#" +  new_id);
                if (iso_elem) {
                    iso_elem.val($(elem).data('iso'));
                }
            }
            $(elem).datetimepicker("setDate", isoTime);
        });
    }

    setup_datetimepicker($(".datetimepicker"));

    $("table.schedule_interviews tbody").delegate(".datetimepicker", "change", function () {
        var isoVal = new Date(this.value).toISOString();
        $(this).data('iso', isoVal);
        var new_id = this.id.replace("scheduled_at", "scheduled_at_iso");
        if (new_id != this.id) {
            var iso_elem = $("#" + new_id);
            if (iso_elem) {
                iso_elem.val(isoVal);
            }
        }
    });

    $(".iso-time").each(function (index, elem) {
        elem.innerHTML = new Date(elem.innerHTML).toLocaleString();
    });

    function toggleModality(modality) {
        if (typeof(modality) == "string") {
            if (modality.indexOf("phone") >= 0) {
                $(".toggle-location").hide();
                $(".toggle-phone").show();
            } else if (modality.indexOf("onsite") >= 0) {
                $(".toggle-location").show();
                $(".toggle-phone").hide();
            }
        }
    }

    toggleModality(
        $("#interview_modality").change(function () {
            toggleModality(this.value);
        }).val()
    );


    var tbody = $('table.schedule_interviews tbody');
    if (tbody.length > 0) {


        // Read all rows and return an array of objects
        function GetAllInterviews()
        {
            var interviews = [];

            tbody.find('tr').each(function (index, value)
            {
                var row = GetRow(index);
                if (row == false) {
                    return false;
                }
                interviews.push(row);
            });

            if (interviews.length < $('table.schedule_interviews tbody tr').length) {
                return false;
            } else {
                var del_ids = tbody.data('del_ids');
                if (del_ids) {
                    $.each(del_ids, function(index, value) {
                        var interview = {};
                        interview.id = value;
                        interview._destroy = true;
                       interviews.push(interview);
                    });
                }
                return interviews;
            }



        }

        // Read the row into an object
        function GetRow(rowNum)
        {
            var row = $('table.schedule_interviews tbody tr').eq(rowNum);

            var interview = {};

            interview.id = row.data('interview_id');
            interview.status = row.find('#status').val();
            if (row.find('.icon-remove').length > 0) {
                interview.scheduled_at_iso = row.find('td:eq(0) input').data('iso');
                interview.duration = row.find('td:eq(1) input').val();
                interview.modality = row.find('td:eq(2) select').val();
                interview.location = row.find('td:eq(3) input').val();
                var interviewer_td = row.find('td:eq(4)');
                var user_ids = interviewer_td.data('user_ids');
                if (user_ids == null || user_ids.length == 0) {
                    alert('No interviewers configured for row ' + (rowNum + 1));
                    return false;
                }
                var origin_user_ids = interviewer_td.data('origin_user_ids');
                if (origin_user_ids) {
                    //We have change
                    interview.user_ids = user_ids;
                }

            }
            return interview;
        }

        function update_schedule_interviews_table() {
            var opening_id = $('#opening_id').val();
            var candidate_id = $('#candidate_id').val();
            tbody.empty();
            tbody.removeData('del_ids');
            var active = opening_id && candidate_id;
            if (active) {
                $('.submit_interviews').show();
                $('.add_new_interview').show();

                $('#participants_department_id').attr('name', null);
                var url = '/interviews/schedule_reload?opening_id=' + opening_id + '&candidate_id=' + candidate_id;
                tbody.load(url, function(data, status) {
                    if (status == 'success') {
                        $(this).find('td .datetimepicker').each(function(index, elem) {
                            setup_datetimepicker(elem);
                        });
                        $(".iso-time").each(function (index, elem) {
                            elem.innerHTML = new Date(elem.innerHTML).toLocaleString();
                        });


                    }
                });
            } else {
                $('.submit_interviews').hide();
                $('.add_new_interview').hide();
            }
        }

        $('#candidate_id').change(update_schedule_interviews_table);


        update_schedule_interviews_table();


        var interviewers_selection_container = $("#interviewers_selection_container");
        function load_interviewers_status(){
            var current_selected_user_ids = interviewers_selection_container.data('user_ids');
            var participants = $('#opening_id').data('participants');
            if (!participants) {
                participants = [];
            }
            $(interviewers_selection_container).find('input:checkbox').each(function(index, elem) {
                if (current_selected_user_ids.indexOf(parseInt($(elem).val())) >=0) {
                    $(elem).prop('checked', true);
                }
                if (participants.indexOf(parseInt($(elem).val())) >= 0) {
                    var tr = $(elem).parent().parent();
                    tr.addClass('starred');
                    tr.next().addClass('starred'); // The same style for the hidden tr

                }
            });


        }


        // We assume a1 and a2 don't have duplicated elements.
        function uniq_array_equal(a1, a2) {
            if (a1.length != a2.length) {
                return false;
            }
            for (var a1_i = 0; a1_i < a1.length; a1_i++) {
                if (a2.indexOf(a1[a1_i]) == -1) {
                    return false;
                }
            }
            for (var a2_i = 0; a2_i < a2.length; a2_i++) {
                if (a1.indexOf(a2[a2_i]) == -1) {
                    return false;
                }
            }
            return true;
        }


        function calculate_interviewers_change(interviewer_td) {

            var new_user_ids = interviewers_selection_container.data('user_ids');
            var old_user_ids = $(interviewer_td).data('user_ids');
            if (uniq_array_equal(new_user_ids, old_user_ids)) {
                //No change comparing to data before dialog open.
                return true;
            }
            $(interviewer_td).data('users', interviewers_selection_container.data('users').slice(0));
            $(interviewer_td).children().first().text(interviewers_selection_container.data('users').join());
            var original_user_ids = $(interviewer_td).data('origin_user_ids');
            if (!original_user_ids) {
                // Definitely a change comparing to content loading
                $(interviewer_td).data('origin_user_ids', old_user_ids.slice(0));
            } else {
                // Check whether we rollback to the original version
                if (uniq_array_equal(new_user_ids, original_user_ids)) {
                    $(interviewer_td).removeData('origin_user_ids');
                }
            }
            $(interviewer_td).data('user_ids', new_user_ids.slice(0));

            return true;
        }

        $('#participants_department_id').change(function() {
            Users.reload_department_users($('#interviewers_selection'), $('#participants_department_id').val(), load_interviewers_status);
        });

        tbody.on('click', 'td .edit_interviewers', function() {
            var interviewer_td = $(this).parent().parent();
            interviewers_selection_container.data('user_ids', interviewer_td.data('user_ids').slice(0));
            interviewers_selection_container.data('users', interviewer_td.data('users').slice(0));

            var new_val = $('#opening_id').data('department');
            $('#interviewers_selection').empty().append('Loading users...');
            $('#participants_department_id').val(new_val);
            Users.reload_department_users($('#interviewers_selection'), $('#participants_department_id').val(), load_interviewers_status);
            interviewers_selection_container.show().dialog({
                width : 400,
                height: 500,
                modal: true,
                buttons: {
                    "OK": function() {
                        $("#interviewers_selection_container").hide().dialog( "close" );
                        calculate_interviewers_change(interviewer_td);
                    },
                    Cancel: function() {
                        $("#interviewers_selection_container").hide().dialog( "close" );
                    }
                }
            });
        });

        interviewers_selection_container.delegate('.pagination a', 'click', function () {
            $('.pagination').html('Page is loading...');
            $('#interviewers_selection').load(this.href, function() {
                load_interviewers_status(this);
            });
            return false;
        });

        interviewers_selection_container.delegate('i.icon-arrow-down', 'click', function () {
            $(this).parent().parent().next().show();
            $(this).removeClass('icon-arrow-down').addClass('icon-arrow-up');
            return false;
        });

        interviewers_selection_container.delegate('i.icon-arrow-up', 'click', function () {
            $(this).parent().parent().next().hide();
            $(this).removeClass('icon-arrow-up').addClass('icon-arrow-down');
            return false;
        });

        $('#interviewers_selection_container').delegate('input:checkbox', 'change', function () {
            var user_ids= interviewers_selection_container.data('user_ids');
            var users = interviewers_selection_container.data('users');
            var current_val = parseInt($(this).val());
            var index = user_ids.indexOf(current_val);
            if (index >= 0) {
                user_ids.splice(index, 1);
                users.splice(index, 1);
            } else {
                user_ids.push(current_val);
                users.push($(this).data('str'));
            }
        });

        $('.add_new_interview').click(function() {
            if (tbody.find('tr').length >= 30) {
                //TODO: just check new added lines, not including existing ones
                alert('Too many interviews scheduled.');
                return;
            }
            var opening_id = $('#opening_id').val();
            var candidate_id = $('#candidate_id').val();
            var url = '/interviews/schedule_add?opening_id=' + opening_id + '&candidate_id=' + candidate_id;
            $.get(url, function(data, status) {
                if (status == 'success') {
                    var newElem = $(data).appendTo(tbody);
                    setup_datetimepicker(newElem.find("td .datetimepicker"));
                }
            });
        });

        tbody.on('click', 'td i.icon-remove', function() {
            var row = $(this).parent().parent();
            if (row.data('interview_id')) {
                var del_ids = tbody.data('del_ids');
                if (!del_ids) {
                    del_ids = [row.data('interview_id')];
                } else {
                    del_ids.push(row.data('interview_id'));
                }
                tbody.data('del_ids', del_ids);
            }
            row.remove();
        });

        $('.submit_interviews').click(function() {
            var interviews = GetAllInterviews();
            if (interviews == false) {
                return false;
            }
            $.post('/interviews/update_multiple',
                {
                    interviews: {
                        opening_id: $('#opening_id').val(),
                        candidate_id: $('#candidate_id').val(),
                        interviews_attributes:interviews
                    }
                })
            .done(function(response) {
                if (!response.success) {
                    $('#error_messages').html('<p class="errors">' + response.messages + '</p>').parent().show();
                }
                else {
                    var url = $('#previous_url').data('value');
                    if (!url) {
                        url = "/interviews"
                    }
                    window.location = url;
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                alert('fail');
            });
        });
    }



});
