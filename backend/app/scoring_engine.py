

def scoring_the_scale(this_scale: dict, answers: dict) -> dict:
    the_scores = {}
    try:
        reverse_items = this_scale["contents"]["reverse_items"]
        scales = this_scale["contents"]["scales"]
        scales_items = this_scale["contents"]["scales_items"]
        factors = this_scale["contents"]["factors"]
        factors_scales = this_scale["contents"]["factors_scales"]
        rating = this_scale["contents"]["rating"]
        score_rules = this_scale["contents"]["score_rules"]

        score_min = 0
        score_max = 0
        for score in score_rules.values():
            score_min = score_min + min(score)
            score_max = score_max + max(score)
        the_scores['score_min'] = score_min
        the_scores['score_max'] = score_max

        items_scores = {}
        for key in rating.keys():
            rates = list(rating[key].keys())
            scores = score_rules[key]
            position = rates.index(answers[key])
            if key not in reverse_items:
                items_scores[key] = scores[position]
            else:
                items_scores[key] = max(scores) + min(scores) - \
                    scores[position]

        scales_scores = {}
        if scales:
            for scale in scales:
                items_in_scale = scales_items[scale]
                scores = 0
                for item in items_in_scale:
                    scores = scores + items_scores[item]
                scales_scores[scale] = scores

        factors_scores = {}
        if factors:
            for factor in factors:
                scales = factors_scales[factor]
                scores = 0
                for scale in scales:
                    scores = scores + scales_scores[scale]
                factors_scores[factor] = scores

        the_scores['items_scores'] = items_scores
        the_scores['scales_scores'] = scales_scores
        the_scores['factors_scores'] = factors_scores
    except Exception:
        print('fail scoring!')

    return the_scores


def scoring_scales_scores_max(
        scales_items: dict, score_rules: dict) -> dict:
    scales_scores_max = {}
    for key, items in scales_items.items():
        scores = 0
        for item in items:
            scores = scores + max(score_rules[item])
        scales_scores_max[key] = scores

    return scales_scores_max


def scoring_Catell_16PF(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_AAQ_II(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_AAS_R(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ABC(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_AIASS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ALBS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_API(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_APIUS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ASAS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ASLSS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ASMHS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ASQ(this_scale: dict, answers: dict) -> dict:
    the_scores = {}
    rating = this_scale["contents"]["rating"]
    score_rules = this_scale["contents"]["score_rules"]
    for key, scores in score_rules.items():
        items_scores = {}
        for k, score in scores.items():
            rate = rating[key]["choices"][k]
            position = list(rate.keys()).index(answers[key][k])
            items_scores[k] = score[position]
        the_scores[key] = items_scores

    return the_scores


def scoring_ASSRS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_BDI(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_BEHAVE_AD(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_BFFP_CAS_B(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_BPRS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_BRMS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_BRUMS_C(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CABS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CARS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CBCL(sub_scales: dict, answers: dict) -> dict:
    the_scores = {}
    for key in sub_scales.keys():
        the_scale = {}
        the_scale['contents'] = sub_scales[key]
        the_scores[key] = scoring_the_scale(the_scale, answers[key])
    return the_scores


def scoring_CBF_PI_B(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CBI_PSCP(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CES_D(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CFMPS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CLS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CMI(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CMLQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CMQI(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CSES(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_CSQ(this_scale: dict, answers: dict) -> dict:

    scales = this_scale["contents"]["scales"]
    scales_items = this_scale["contents"]["scales_items"]
    factors = this_scale["contents"]["factors"]
    factors_scales = this_scale["contents"]["factors_scales"]
    rating = this_scale["contents"]["rating"]
    score_rules = this_scale["contents"]["score_rules"]

    score_min = 0
    score_max = 0
    for score in score_rules.values():
        score_min = score_min + min(score)
        score_max = score_max + max(score)
    the_scores = {}
    the_scores['score_min'] = score_min
    the_scores['score_max'] = score_max

    items_scores = {}
    for key in rating.keys():
        rates = list(rating[key].keys())
        scores = score_rules[key]
        position = rates.index(answers[key])
        items_scores[key] = scores[position]

    scales_scores = {}
    scales_scores_max = {}
    for scale in scales:
        items_in_scale = scales_items[scale]
        scores = 0
        scores_max = 0
        for item in items_in_scale:
            if "-" not in item:
                scores = scores + items_scores[item]
                scores_max = scores_max+max(score_rules[item])
            else:
                item = item.split("-")[-1]
                score = score_rules[item]
                scores = scores + max(score)+min(score)-items_scores[item]
                scores_max = scores_max+max(score)
        scales_scores[scale] = scores
        scales_scores_max[scale] = scores_max

    factors_scores = {}
    factors_scores_max = {}
    for factor in factors:
        scores = 0
        scores_max = 0
        for scale in factors_scales[factor]:
            scores = scores+scales_scores[scale]
            scores_max = scores_max+scales_scores_max[scale]
        factors_scores[factor] = scores
        factors_scores_max[factor] = scores_max

    the_scores['items_scores'] = items_scores
    the_scores['scales_scores'] = scales_scores
    the_scores['scales_scores_max'] = scales_scores_max
    the_scores['factors_scores'] = factors_scores
    the_scores['factors_scores_max'] = factors_scores_max
    return the_scores


def scoring_DCCC(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_DEQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_DES_II(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_DSRSC(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_EMBU(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_EMP(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_EPDS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_EPQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_EQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_FACES_II(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_FIS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_FNE_R(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_FPQ_CR_B(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_GAEQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_GCQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_GDS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_HAD(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_HAMA(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_HAMD(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_HCL_32(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_IADDS_MSS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ISLQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ITS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_JWS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_LAIS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_LES(this_scale: dict, answers: dict) -> dict:

    rating = this_scale["contents"]["rating"]
    score_rules = this_scale["contents"]["score_rules"]

    items_scores = {}
    for key in rating.keys():
        scores = {}
        for kk in rating[key].keys():
            rate = rating[key][kk]
            position = list(rate.keys()).index(answers[key][kk])
            scores[kk] = score_rules[key][kk][position]
        items_scores[key] = scores

    items_plus = []
    items_minus = []
    for key in answers.keys():
        if answers[key]['性质'] == 'A':
            items_plus.append(key)
        else:
            items_minus.append(key)

    the_scores = {}
    the_scores['items_scores'] = items_scores
    the_scores['items_plus'] = items_plus
    the_scores['items_minus'] = items_minus
    return the_scores


def scoring_LMQ_CS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_LSSMSS(this_scale: dict, answers: dict) -> dict:

    rating = this_scale["contents"]["rating"]
    score_rules = this_scale["contents"]["score_rules"]

    items_scores = {}
    for key in rating.keys():
        scores = {}
        for kk in rating[key].keys():
            rate = rating[key][kk]
            position = list(rate.keys()).index(answers[key][kk])
            scores[kk] = score_rules[key][kk][position]
        items_scores[key] = scores

    items_plus = []
    items_zero = []
    items_minus = []
    for key in answers.keys():
        if answers[key]['事件性质'] == 'A':
            items_plus.append(key)
        elif answers[key]['事件性质'] == 'B':
            items_zero.append(key)
        else:
            items_minus.append(key)

    the_scores = {}
    the_scores['items_scores'] = items_scores
    the_scores['items_plus'] = items_plus
    the_scores['items_zero'] = items_zero
    the_scores['items_minus'] = items_minus
    return the_scores


def scoring_MDQ(this_scale: dict, answers: dict) -> dict:
    rating = this_scale["contents"]["rating"]
    score_rules = this_scale["contents"]["score_rules"]

    subkey = list(rating['1'].keys())[0]
    subrating = list(rating['1'].values())[0]
    answer = answers['1'][subkey]
    scores = score_rules['1'][subkey]

    items_scores = {}
    sub_scores = {}
    for key in subrating.keys():
        position = list(subrating[key].keys()).index(answer[key])
        sub_scores[key] = scores[key][position]
    items_scores['1'] = {subkey: sub_scores}

    position = list(rating['2'].keys()).index(answers['2'])
    items_scores['2'] = score_rules['2'][position]

    position = list(rating['3'].keys()).index(answers['3'])
    items_scores['3'] = score_rules['3'][position]

    score_max = {}
    score_max['1'] = sum([max(scores[key]) for key in scores.keys()])
    score_max['2'] = max(score_rules['2'])
    score_max['3'] = max(score_rules['3'])

    the_scores = {}
    the_scores['items_scores'] = items_scores
    the_scores['score_max'] = score_max
    return the_scores


def scoring_MHS_CA(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_MPS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_MSCPOR(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_MTGPS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_MUNSH(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_N_BPRS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_NOSIE(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_NPI_Q(this_scale: dict, answers: dict) -> dict:
    score_rules = this_scale["contents"]["score_rules"]
    rating = this_scale["contents"]["rating"]
    items_scores = {}
    for key in rating.keys():
        rates = rating[key]
        scores = score_rules[key]
        answer = answers[key]
        score = {}
        for k, v in answer.items():
            position = list(rates[k].keys()).index(v)
            score[k] = scores[k][position]
        items_scores[key] = score

    the_scores = {}
    the_scores['items_scores'] = items_scores
    return the_scores


def scoring_OCSI_U(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ODGS(this_scale: dict, answers: dict) -> dict:
    scales_items = this_scale["contents"]["scales_items"]
    score_rules = this_scale["contents"]["score_rules"]
    items_scores = {}
    for key in answers.keys():
        if answers[key] == score_rules[key]:
            items_scores[key] = 1
        else:
            items_scores[key] = 0

    scales_scores = {}
    for key in scales_items.keys():
        scales_scores[key] = sum(
            [items_scores[item] for item in scales_items[key]])

    the_scores = {}
    the_scores['items_scores'] = items_scores
    the_scores['scales_scores'] = scales_scores
    return the_scores


def scoring_PANSS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PAS(sub_scales: dict, answers: dict) -> dict:
    the_scores = {}
    for key in sub_scales.keys():
        the_scale = {}
        the_scale['contents'] = sub_scales[key]
        the_scores[key] = scoring_the_scale(the_scale, answers[key])
    return the_scores


def scoring_PCL(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PDQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PDSS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PES(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PHCSS(this_scale: dict, answers: dict) -> dict:
    scales_items = this_scale["contents"]["scales_items"]
    score_rules = this_scale["contents"]["score_rules"]
    items_scores = {}
    for key in answers.keys():
        if answers[key] == score_rules[key]:
            items_scores[key] = 1
        else:
            items_scores[key] = 0

    scales_scores = {}
    for key in scales_items.keys():
        scales_scores[key] = sum(
            [items_scores[item] for item in scales_items[key]])

    the_scores = {}
    the_scores['items_scores'] = items_scores
    the_scores['scales_scores'] = scales_scores
    return the_scores


def scoring_PHSCS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PRCA(this_scale: dict, answers: dict, sub_answers: dict) -> dict:
    scales = this_scale["contents"]["scales"]
    scales_items = this_scale["contents"]["scales_items"]
    rating = this_scale["contents"]["rating"]
    score_rules = this_scale["contents"]["score_rules"]
    sub_rating = this_scale["contents"]["sub_rating"]
    sub_score_rules = this_scale["contents"]["sub_score_rules"]

    items_scores = {}
    sub_items_scores = {}
    for key in rating.keys():
        position = list(rating[key].keys()).index(answers[key])
        items_scores[key] = score_rules[key][position]
        sub_scores = {}
        for k in sub_rating[key].keys():
            position = list(sub_rating[key][k].keys()).index(
                sub_answers[key][k])
            sub_scores[k] = sub_score_rules[key][k][position]
        sub_items_scores[key] = sub_scores

    for key in items_scores.keys():
        values = list(sub_items_scores[key].values())
        if 0 in list(values):
            items_scores[key] = 0
        else:
            items_scores[key] = items_scores[key]*sum(values)/2

    scales_scores = {}
    for scale in scales:
        scales_scores[scale] = sum(
            [items_scores[item] for item in scales_items[scale]])

    the_scores = {}
    the_scores['items_scores'] = items_scores
    the_scores['scales_scores'] = scales_scores
    return the_scores


def scoring_PRS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PSAI(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PSCI_M(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_PSSCSL(this_scale: dict, answers: dict) -> dict:
    scales_items = this_scale["contents"]["scales_items"]
    rating = this_scale["contents"]["rating"]
    score_rules = this_scale["contents"]["score_rules"]
    weights = this_scale["contents"]["weights"]

    items_scores = {}
    items_scores_max = {}
    for key in rating.keys():
        position = list(rating[key].keys()).index(answers[key])
        items_scores[key] = score_rules[key][position]*weights[key]
        items_scores_max[key] = max(score_rules[key])*weights[key]

    scales_scores = {}
    scales_scores_max = {}
    for key in scales_items.keys():
        scales_scores[key] = sum(
            [items_scores[item] for item in scales_items[key]])
        scales_scores_max[key] = sum(
            [items_scores_max[item] for item in scales_items[key]]
        )

    the_scores = {}
    the_scores['items_scores'] = items_scores
    the_scores['items_scores_max'] = items_scores_max
    the_scores['scales_scores'] = scales_scores
    the_scores['scales_scores_max'] = scales_scores_max
    return the_scores


def scoring_PTSMS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_QDV(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_QLSCA(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_QMPCAS_JMS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_QSCAMS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_RSES(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SAD(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SAQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SAS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SASC(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SBS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SCARED(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SCL_90(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SCSQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SDLRS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SDQ(sub_scales: dict, answers: dict) -> dict:
    the_scores = {}
    for key in sub_scales.keys():
        the_scale = {}
        the_scale['contents'] = sub_scales[key]
        the_scores[key] = scoring_the_scale(the_scale, answers[key])
    return the_scores


def scoring_SDS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SLCS_R(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SRHMS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SRSS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SSMSS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_SSRS(this_scale: dict, answers: dict) -> dict:
    rating = this_scale["contents"]['rating']
    scales_items = this_scale["contents"]["scales_items"]
    score_rules = this_scale["contents"]["score_rules"]

    items_scores_min = {}
    items_scores_max = {}
    for key in score_rules.keys():
        items_scores_min[key] = min(score_rules[key])
        items_scores_max[key] = max(score_rules[key])
    rate = rating['6']['B']
    items_scores_max['6'] = len(rate[list(rate.keys())[0]])
    rate = rating['7']['B']
    items_scores_max['7'] = len(rate[list(rate.keys())[0]])

    score_min = sum(list(items_scores_min.values()))
    score_max = sum(list(items_scores_max.values()))

    items_scores = {}
    for key in rating.keys():
        if key == '6' or key == '7':
            if answers[key] == 'A':
                items_scores[key] = 0
            else:
                items_scores[key] = len(answers[key])
        else:
            position = list(rating[key].keys()).index(answers[key])
            items_scores[key] = score_rules[key][position]

    scales_scores = {}
    scales_scores_max = {}
    for key in scales_items.keys():
        scales_scores[key] = sum(
            [items_scores[item] for item in scales_items[key]])
        scales_scores_max[key] = sum(
            [items_scores_max[item] for item in scales_items[key]]
        )

    the_scores = {}
    the_scores['score_min'] = score_min
    the_scores['score_max'] = score_max
    the_scores['items_scores'] = items_scores
    the_scores['scales_scores'] = scales_scores
    the_scores['scales_scores_max'] = scales_scores_max
    return the_scores


def scoring_STAI(sub_scales: dict, answers: dict) -> dict:
    the_scores = {}
    for key in sub_scales.keys():
        the_scale = {}
        the_scale['contents'] = sub_scales[key]
        the_scores[key] = scoring_the_scale(the_scale, answers[key])
    return the_scores


def scoring_TAI(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_TAS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_TLQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_TSI(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_UCLA_LS_V3(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_WFCS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_WQIT(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_Y_BOCS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_YMRS(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores


def scoring_ZNPQ(this_scale: dict, answers: dict) -> dict:
    the_scores = scoring_the_scale(this_scale, answers)
    return the_scores
